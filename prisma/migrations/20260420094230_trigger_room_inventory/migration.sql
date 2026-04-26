-- Simple function to populate room_type_inventories for the next 30 days for a given room_type_id
CREATE OR REPLACE FUNCTION populate_room_type_inventory_for_next_30_days(p_room_type_id uuid)
RETURNS VOID AS $$
BEGIN
  INSERT INTO room_type_inventories (room_type_id, date, total_rooms, booked_rooms, created_at, updated_at)
  SELECT
    p_room_type_id,
    (current_date + offs) AS date,
    COALESCE(
      (SELECT count(*) FROM rooms r
       WHERE r.type_id = p_room_type_id
         AND r.status = 'ACTIVE'), 0
    ) AS total_rooms,
    0 AS booked_rooms,
    now() AS created_at,
    now() AS updated_at
  FROM generate_series(0, 29) AS offs
  WHERE NOT EXISTS (
    SELECT 1 FROM room_type_inventories i
    WHERE i.room_type_id = p_room_type_id AND i.date = (current_date + offs)
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger function to call the population function after a new room_type is inserted
CREATE OR REPLACE FUNCTION trg_generate_room_type_inventory_after_insert()
RETURNS trigger AS $$
BEGIN
  PERFORM populate_room_type_inventory_for_next_30_days(NEW.id::uuid);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on room_types to call the function after insert
DROP TRIGGER IF EXISTS trg_generate_room_type_inventory ON room_types;
CREATE TRIGGER trg_generate_room_type_inventory
  AFTER INSERT ON room_types
  FOR EACH ROW
  EXECUTE FUNCTION trg_generate_room_type_inventory_after_insert();

-- One-time seed: populate inventory for existing room types for the next 30 days
DO $$
DECLARE
  rt RECORD;
BEGIN
  FOR rt IN SELECT id FROM room_types LOOP
    PERFORM populate_room_type_inventory_for_next_30_days(rt.id::uuid);
  END LOOP;
END;
$$;

-- Ensure index exists for scaling NOT EXISTS clause
CREATE INDEX IF NOT EXISTS idx_room_type_inventories_room_type_id_date
  ON room_type_inventories (room_type_id, date);


CREATE OR REPLACE FUNCTION trg_sync_room_type_inventory()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'ACTIVE' THEN
      PERFORM populate_room_type_inventory_for_next_30_days(NEW.type_id::uuid);
      UPDATE room_type_inventories
      SET total_rooms = total_rooms + 1
      WHERE room_type_id = NEW.type_id::uuid
        AND date >= current_date
        AND date < current_date + 30;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'ACTIVE' THEN
      PERFORM populate_room_type_inventory_for_next_30_days(OLD.type_id::uuid);
      UPDATE room_type_inventories
      SET total_rooms = GREATEST(total_rooms - 1, 0)
      WHERE room_type_id = OLD.type_id::uuid
        AND date >= current_date
        AND date < current_date + 30;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If type or status changed, adjust old/new counts
    IF (OLD.type_id IS DISTINCT FROM NEW.type_id) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
      IF OLD.status = 'ACTIVE' THEN
        PERFORM populate_room_type_inventory_for_next_30_days(OLD.type_id::uuid);
        UPDATE room_type_inventories
        SET total_rooms = GREATEST(total_rooms - 1, 0)
        WHERE room_type_id = OLD.type_id::uuid
          AND date >= current_date
          AND date < current_date + 30;
      END IF;

      IF NEW.status = 'ACTIVE' THEN
        PERFORM populate_room_type_inventory_for_next_30_days(NEW.type_id::uuid);
        UPDATE room_type_inventories
        SET total_rooms = total_rooms + 1
        WHERE room_type_id = NEW.type_id::uuid
          AND date >= current_date
          AND date < current_date + 30;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_room_type_inventory ON rooms;
CREATE TRIGGER trg_sync_room_type_inventory
  AFTER INSERT OR UPDATE OR DELETE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_room_type_inventory();








------------------------- -- Booking reservation and release functions -- may cut to other file.

CREATE OR REPLACE FUNCTION reserve_booking(p_booking_id uuid)
RETURNS void AS $$
DECLARE
  b RECORD;
  v_dummy INT;
BEGIN
  SELECT bk.room_type_id, bk.check_in_date, bk.check_out_date, bk.num_rooms
  INTO b
  FROM bookings bk
  WHERE bk.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- ensure inventory rows exist (your populate function)
  PERFORM populate_room_type_inventory_for_next_30_days(b.room_type_id::uuid);

  -- lock the rows for the date range
  WITH dates AS (
    SELECT generate_series(
      b.check_in_date::date,
      (b.check_out_date::date - INTERVAL '1 day')::date,
      INTERVAL '1 day'
    )::date AS d
  )
  SELECT 1 INTO v_dummy
  FROM room_type_inventories i
  JOIN dates ON i.date = dates.d
  WHERE i.room_type_id = b.room_type_id::uuid
  FOR UPDATE;

  -- check capacity (use its own CTE scope)
  IF EXISTS (
    WITH dates AS (
      SELECT generate_series(
        b.check_in_date::date,
        (b.check_out_date::date - INTERVAL '1 day')::date,
        INTERVAL '1 day'
      )::date AS d
    )
    SELECT 1
    FROM room_type_inventories i
    JOIN dates ON i.date = dates.d
    WHERE i.room_type_id = b.room_type_id::uuid
      AND (i.booked_rooms + b.num_rooms) > i.total_rooms
  ) THEN
    RAISE EXCEPTION 'Not enough rooms for booking %', p_booking_id;
  END IF;

  -- apply reservation (define dates again for this statement)
  WITH dates AS (
    SELECT generate_series(
      b.check_in_date::date,
      (b.check_out_date::date - INTERVAL '1 day')::date,
      INTERVAL '1 day'
    )::date AS d
  )
  UPDATE room_type_inventories
  SET booked_rooms = booked_rooms + b.num_rooms,
      updated_at = now()
  FROM dates
  WHERE room_type_inventories.room_type_id = b.room_type_id::uuid
    AND room_type_inventories.date = dates.d;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_booking(p_booking_id uuid)
RETURNS void AS $$
DECLARE
  b RECORD;
  v_dummy INT;
BEGIN
  SELECT bk.room_type_id, bk.check_in_date, bk.check_out_date, bk.num_rooms
  INTO b
  FROM bookings bk
  WHERE bk.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- lock rows for the date range (define dates CTE here)
  WITH dates AS (
    SELECT generate_series(
      b.check_in_date::date,
      (b.check_out_date::date - INTERVAL '1 day')::date,
      INTERVAL '1 day'
    )::date AS d
  )
  SELECT 1 INTO v_dummy
  FROM room_type_inventories i
  JOIN dates ON i.date = dates.d
  WHERE i.room_type_id = b.room_type_id::uuid
  FOR UPDATE;

  -- perform decrement (define dates again)
  WITH dates AS (
    SELECT generate_series(
      b.check_in_date::date,
      (b.check_out_date::date - INTERVAL '1 day')::date,
      INTERVAL '1 day'
    )::date AS d
  )
  UPDATE room_type_inventories
  SET booked_rooms = GREATEST(booked_rooms - b.num_rooms, 0),
      updated_at = now()
  FROM dates
  WHERE room_type_inventories.room_type_id = b.room_type_id::uuid
    AND room_type_inventories.date = dates.d;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION trg_booking_reserve_release()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'PAID' THEN
      PERFORM reserve_booking(NEW.id::uuid);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- reserve when status becomes PAID
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      IF OLD.status <> 'PAID' AND NEW.status = 'PAID' THEN
        PERFORM reserve_booking(NEW.id::uuid);
      ELSIF OLD.status = 'PAID' AND (NEW.status = 'CANCELLED' OR NEW.status = 'EXPIRED') THEN
        PERFORM release_booking(NEW.id::uuid);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'PAID' THEN
      PERFORM release_booking(OLD.id::uuid);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_reserve_release ON bookings;
CREATE TRIGGER trg_booking_reserve_release
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trg_booking_reserve_release();
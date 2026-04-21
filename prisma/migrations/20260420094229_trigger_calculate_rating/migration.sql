CREATE OR REPLACE FUNCTION recalculate_rating() RETURNS trigger AS $$
DECLARE
    affected_booking_id_old UUID;
    affected_booking_id_new UUID;
    hotel_id_new UUID;
    hotel_id_old UUID;
    avg_points NUMERIC;
    review_count INTEGER;
BEGIN
    -- determine booking ids depending on operation
    IF TG_OP = 'INSERT' THEN
        affected_booking_id_new := NEW.booking_id;
        -- compute hotel for the new bookingId by joining to BookingMetadata -> RoomType
        SELECT rt.hotel_id INTO hotel_id_new
        FROM bookings b
        JOIN booking_metadata bm ON b.metadata_id = bm.id
        JOIN room_types rt ON bm.room_type_id = rt.id
        WHERE b.id = affected_booking_id_new;

        IF hotel_id_new IS NULL THEN
            RETURN NULL;
        END IF;

        SELECT COALESCE(AVG(rv.rating)::NUMERIC, 0), COUNT(rv.*)
        INTO avg_points, review_count
        FROM reviews rv
        JOIN bookings b2 ON rv.booking_id = b2.id
        JOIN booking_metadata bm2 ON b2.metadata_id = bm2.id
        JOIN room_types rt2 ON bm2.room_type_id = rt2.id
        WHERE rt2.hotel_id = hotel_id_new;

        UPDATE hotels
        SET "rating" = avg_points,
            "number_of_reviews" = review_count
        WHERE id = hotel_id_new;

        RETURN NULL;

    ELSIF TG_OP = 'UPDATE' THEN
        affected_booking_id_old := OLD.booking_id;
        affected_booking_id_new := NEW.booking_id;

        -- if bookingId changed, recalc for the old hotel too
        IF affected_booking_id_old IS NOT NULL AND affected_booking_id_old <> affected_booking_id_new THEN
            SELECT rt_old.hotel_id INTO hotel_id_old
            FROM bookings b
            JOIN booking_metadata bm_old ON b.metadata_id = bm_old.id
            JOIN room_types rt_old ON bm_old.room_type_id = rt_old.id
            WHERE b.id = affected_booking_id_old;
            IF hotel_id_old IS NOT NULL THEN
                SELECT COALESCE(AVG(rv.rating)::NUMERIC, 0), COUNT(rv.*)
                INTO avg_points, review_count
                FROM reviews rv
                JOIN bookings b2 ON rv.booking_id = b2.id
                JOIN booking_metadata bm2 ON b2.metadata_id = bm2.id
                JOIN room_types rt2 ON bm2.room_type_id = rt2.id
                WHERE rt2.hotel_id = hotel_id_old;

                UPDATE hotels
                SET "rating" = avg_points,
                    "number_of_reviews" = review_count
                WHERE id = hotel_id_old;
            END IF;
        END IF;

        -- always recalc for the (new) hotel's id
        SELECT rt.hotel_id INTO hotel_id_new
        FROM bookings b
        JOIN booking_metadata bm ON b.metadata_id = bm.id
        JOIN room_types rt ON bm.room_type_id = rt.id
        WHERE b.id = affected_booking_id_new;
        IF hotel_id_new IS NOT NULL THEN
            SELECT COALESCE(AVG(rv.rating)::NUMERIC, 0), COUNT(rv.*)
            INTO avg_points, review_count
            FROM reviews rv
            JOIN bookings b2 ON rv.booking_id = b2.id
            JOIN booking_metadata bm2 ON b2.metadata_id = bm2.id
            JOIN room_types rt2 ON bm2.room_type_id = rt2.id
            WHERE rt2.hotel_id = hotel_id_new;

            UPDATE hotels
            SET "rating" = avg_points,
                "number_of_reviews" = review_count
            WHERE id = hotel_id_new;
        END IF;

        RETURN NULL;

    ELSIF TG_OP = 'DELETE' THEN
        affected_booking_id_old := OLD.booking_id;
        SELECT rt_old.hotel_id INTO hotel_id_old
        FROM bookings b
        JOIN booking_metadata bm_old ON b.metadata_id = bm_old.id
        JOIN room_types rt_old ON bm_old.room_type_id = rt_old.id
        WHERE b.id = affected_booking_id_old;
        IF hotel_id_old IS NOT NULL THEN
            SELECT COALESCE(AVG(rv.rating)::NUMERIC, 0), COUNT(rv.*)
            INTO avg_points, review_count
            FROM reviews rv
            JOIN bookings b2 ON rv.booking_id = b2.id
            JOIN booking_metadata bm2 ON b2.metadata_id = bm2.id
            JOIN room_types rt2 ON bm2.room_type_id = rt2.id
            WHERE rt2.hotel_id = hotel_id_old;

            UPDATE hotels
            SET "rating" = avg_points,
                "number_of_reviews" = review_count
            WHERE id = hotel_id_old;
        END IF;

        RETURN NULL;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function after mutations on reviews
DROP TRIGGER IF EXISTS recalculate_rating_trigger ON reviews;
CREATE TRIGGER recalculate_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION recalculate_rating();
-- @param {String} $1:hotelId (references hotels.id)
SELECT
  rt.id AS "roomTypeId",
  rt.name AS "roomTypeName",
  COALESCE(total_rooms.total_rooms, 0)::int AS "totalRooms",
  COALESCE(booked_rooms.booked_rooms, 0)::int AS "bookedRooms",
  CASE
    WHEN COALESCE(total_rooms.total_rooms, 0) = 0 THEN 0
    ELSE LEAST(100, ROUND((COALESCE(booked_rooms.booked_rooms, 0)::numeric / total_rooms.total_rooms::numeric) * 100))
  END::int AS pct
FROM room_types rt
LEFT JOIN (
  SELECT type_id, COUNT(*) AS total_rooms
  FROM rooms
  GROUP BY type_id
) total_rooms ON total_rooms.type_id = rt.id
LEFT JOIN (
  SELECT room_type_id, SUM(num_rooms) AS booked_rooms
  FROM bookings
  WHERE status IN ('PAID', 'CHECKED_IN')
    AND check_in_date <= CURRENT_DATE
    AND check_out_date > CURRENT_DATE
  GROUP BY room_type_id
) booked_rooms ON booked_rooms.room_type_id = rt.id
WHERE rt.hotel_id = $1
ORDER BY pct DESC, rt.name ASC;

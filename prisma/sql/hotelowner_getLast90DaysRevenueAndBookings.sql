-- @param {String} $1:hotelId (references hotels.id)
SELECT d.day,
       COALESCE(b.total_revenue, 0)::numeric AS total_revenue,
       COALESCE(b.bookings, 0)::int AS bookings
FROM generate_series(
       (now() - INTERVAL '89 days')::date,
       now()::date,
       '1 day'
     ) AS d(day)
LEFT JOIN (
  SELECT date_trunc('day', bm.created_at)::date AS day,
         SUM(snapshot_room_price * num_rooms) AS total_revenue,
         COUNT(bm.id)::int AS bookings
  FROM booking_metadata bm
  JOIN room_types rt ON bm.room_type_id = rt.id
  WHERE rt.hotel_id = $1
  AND bm.created_at >= now() - INTERVAL '90 days'
  GROUP BY day
) b USING (day)
ORDER BY d.day ASC;
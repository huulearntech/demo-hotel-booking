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
  SELECT date_trunc('day', b.created_at)::date AS day,
         SUM(b.snapshot_room_price * b.num_rooms * (b.check_out_date::date - b.check_in_date::date)) AS total_revenue,
         COUNT(b.id)::int AS bookings
  FROM bookings b
  JOIN room_types rt ON b.room_type_id = rt.id
  WHERE rt.hotel_id = $1
  AND b.status IN ('PAID', 'CHECKED_IN', 'CHECKED_OUT')
  AND b.created_at >= now() - INTERVAL '90 days'
  GROUP BY day
) b USING (day)
ORDER BY d.day ASC;
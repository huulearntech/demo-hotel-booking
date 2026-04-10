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
  SELECT date_trunc('day', created_at)::date AS day,
         SUM(snapshot_room_price * num_rooms) AS total_revenue,
         COUNT(id)::int AS bookings
  FROM "BookingMetadata"
  WHERE hotel_id = $1
    AND created_at >= now() - INTERVAL '90 days'
  GROUP BY day
) b USING (day)
ORDER BY d.day ASC;

-- Pet project so bookings won't exceed regular number range.
-- @param {String} $2:hotelOwnerId
-- SELECT d.day,
--        COALESCE(b.total_revenue, 0)::numeric AS total_revenue,
--        COALESCE(b.bookings, 0)::int AS bookings
-- FROM generate_series(
--        (now() - INTERVAL '89 days')::date,
--        now()::date,
--        '1 day'
--      ) AS d(day)
-- LEFT JOIN (
--   SELECT date_trunc('day', bm.created_at)::date AS day,
--          SUM(bm.snapshot_room_price * bm.num_rooms) AS total_revenue,
--          COUNT(bm.id)::int AS bookings
--   FROM "BookingMetadata" bm
--   JOIN "Hotel" h ON h.id = bm.hotel_id AND h.owner_id = $2
--   WHERE bm.hotel_id = $1
--     AND bm.created_at >= now() - INTERVAL '90 days'
--   GROUP BY day
-- ) b USING (day)
-- ORDER BY d.day ASC;
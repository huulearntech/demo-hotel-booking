-- @param {String} $1:hotelId (references hotels.id)
SELECT s.star,
       COALESCE(c.cnt, 0)::int AS count
FROM generate_series(1, 5) AS s(star)
LEFT JOIN (
  SELECT r.rating AS star,
         COUNT(*) AS cnt
  FROM reviews r
  JOIN bookings b ON r.booking_id = b.id
  JOIN room_types rt ON b.room_type_id = rt.id
  WHERE rt.hotel_id = $1
    AND r.created_at >= now() - INTERVAL '90 days' -- TODO: Should I filter or select all?
  GROUP BY r.rating
) c ON c.star = s.star
ORDER BY s.star ASC;

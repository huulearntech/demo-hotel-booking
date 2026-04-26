-- @param {String} $1:hotelId (references hotels.id)
SELECT
  rt.name AS room_type_name,
  COUNT(r.id) AS rating_count,
  COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS avg_rating,
  COALESCE(jsonb_agg(jsonb_build_object(
    'bookingId', b.id,
    'rating',    r.rating,
    'comment',   r.comment,
    'createdAt', r.created_at
  ) ORDER BY r.created_at) FILTER (WHERE r.id IS NOT NULL), '[]') AS ratings
FROM reviews r
JOIN bookings b ON r.booking_id = b.id
JOIN room_types rt ON b.room_type_id = rt.id
WHERE rt.hotel_id = $1
AND r.created_at >= now() - INTERVAL '90 days'
GROUP BY rt.name
ORDER BY avg_rating DESC NULLS LAST, rating_count DESC;
-- @param {String} $1:hotelId (references hotels.id)
SELECT
  rt.name AS room_type_name,
  COUNT(r.id) AS rating_count,
  COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS avg_rating,
  COALESCE(jsonb_agg(jsonb_build_object(
    'booking_id', b.id,
    'rating', r.rating,
    'comment', r.comment,
    'created_at', r.created_at
  ) ORDER BY r.created_at) FILTER (WHERE r.id IS NOT NULL), '[]') AS ratings
FROM room_types rt
LEFT JOIN booking_metadata bm
  ON bm.room_type_id = rt.id
LEFT JOIN bookings b
  ON b.metadata_id = bm.id
LEFT JOIN reviews r
  ON r.booking_id = b.id
  AND r.created_at >= now() - INTERVAL '90 days'
WHERE rt.hotel_id = $1
GROUP BY rt.name
ORDER BY avg_rating DESC NULLS LAST, rating_count DESC;
-- @param {String}   $1:hotelId
-- @param {DateTime} $2:cursorCreatedAt? (timestamp with time zone | pass NULL for first page)
-- @param {String}   $3:cursorId? (pass NULL for first page)
-- @param {Int}      $4:limit

SELECT
  r.id AS "reviewId",
  r.rating,
  r.comment,
  r.created_at AS "createdAt",
  r.reply,
  r.replied_at AS "repliedAt",
  u.id AS "authorId",
  u.name AS "authorName",
  u.profile_image_url AS "authorProfileImageUrl"
FROM reviews r
JOIN bookings b ON r.booking_id = b.id
JOIN room_types rt ON b.room_type_id = rt.id
JOIN users u ON b.user_id = u.id
WHERE rt.hotel_id = $1
  AND (
    $2::TIMESTAMP IS NULL
    OR (r.created_at, r.id) < ($2, $3::uuid)
  )
ORDER BY r.created_at DESC, r.id DESC
LIMIT $4;
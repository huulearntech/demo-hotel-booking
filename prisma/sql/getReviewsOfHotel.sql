-- @param {String}   $1:hotelId
-- @param {DateTime} $2:cursorCreatedAt? (timestamp with time zone | pass NULL for first page)
-- @param {String}   $3:cursorId? (pass NULL for first page)
-- @param {Int}      $4:limit

SELECT
  r.id AS review_id,
  r.rating,
  r.comment,
  r.created_at,
  r.reply,
  r.replied_at,
  u.id AS author_id,
  u.name AS author_name,
  u.profile_image_url AS author_profile_image
FROM reviews r
JOIN bookings b ON r.booking_id = b.id
JOIN booking_metadata bm ON b.metadata_id = bm.id
JOIN room_types rt ON bm.room_type_id = rt.id
JOIN users u ON bm.user_id = u.id
WHERE rt.hotel_id = $1
  AND (
    $2::TIMESTAMP IS NULL
    OR (r.created_at, r.id) < ($2, $3::uuid)
  )
ORDER BY r.created_at DESC, r.id DESC
LIMIT $4;
-- TODO: rename to camelCase for consistency.

-- Notes:
-- - Use the pair (created_at, id) as the cursor to provide stable ordering and avoid duplicates when multiple reviews share the same timestamp.
-- - For the first page, supply NULL for $2 and $3.
-- - To build the next-page cursor, take the created_at and id of the last row returned and pass them as $2 and $3 for the subsequent call.
-- - Adjust the parameter types to your driver if needed (e.g. named parameters).

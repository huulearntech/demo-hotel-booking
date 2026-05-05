-- @param {String}   $1:hotelId
-- @param {DateTime} $2:prevCursorCreatedAt? (timestamp with time zone | pass NULL for first page)
-- @param {String}   $3:prevCursorId? (pass NULL for first page)
-- @param {DateTime} $4:nextCursorCreatedAt? (timestamp with time zone | pass NULL for first page)
-- @param {String}   $5:nextCursorId? (pass NULL for first page)
-- @param {Boolean}  $6:directionIsNext
-- @param {Int}      $7:limit

SELECT
  r.id,
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
    -- if requesting next and no next-cursor, or requesting prev and no prev-cursor -> no cursor filter
    ($6 AND $4::TIMESTAMP IS NULL)
    OR (NOT $6 AND $2::TIMESTAMP IS NULL)
    -- otherwise apply the appropriate cursor comparison
    OR (
      ($6 AND (r.created_at, r.id) < ($4, $5::uuid))
      OR (NOT $6 AND (r.created_at, r.id) > ($2, $3::uuid))
    )
  )
ORDER BY
  -- when navigating forward (next) or when there's no prev-cursor (first page) use DESC
  CASE WHEN ($6 OR $2::TIMESTAMP IS NULL) THEN r.created_at END DESC,
  CASE WHEN ($6 OR $2::TIMESTAMP IS NULL) THEN r.id END DESC,
  -- otherwise (navigating backward with a prev-cursor) use ASC
  CASE WHEN NOT ($6 OR $2::TIMESTAMP IS NULL) THEN r.created_at END ASC,
  CASE WHEN NOT ($6 OR $2::TIMESTAMP IS NULL) THEN r.id END ASC
LIMIT $7;
-- @param {String}   $1:hotelId (references hotels.id)
-- @param {Int}      $2:limit
-- @param {DateTime} $3:cursorCreatedAt?
-- @param {String}   $4:cursorId?
-- @param {Boolean}  $5:replied? (true = replied only, false = unreplied only, null = all)
SELECT
  r.id,
  r.rating,
  r.comment,
  r.created_at AS "createdAt",
  r.reply,
  r.replied_at AS "repliedAt",
  b.id AS "bookingId",
  b.snapshot_room_type_name AS "roomTypeName",
  b.check_in_date AS "checkInDate",
  b.check_out_date AS "checkOutDate",
  u.id AS "authorId",
  u.name AS "authorName",
  u.email AS "authorEmail",
  u.profile_image_url AS "authorProfileImageUrl"
FROM reviews r
JOIN bookings b ON r.booking_id = b.id
JOIN room_types rt ON b.room_type_id = rt.id
JOIN users u ON b.user_id = u.id
WHERE rt.hotel_id = $1::uuid
  AND (
    $3::timestamptz IS NULL
    OR (
      r.created_at < $3::timestamptz
      OR (r.created_at = $3::timestamptz AND r.id < $4::uuid)
    )
  )
  AND (
    $5::boolean IS NULL
    OR ($5::boolean AND r.reply IS NOT NULL)
    OR (NOT $5::boolean AND r.reply IS NULL)
  )
ORDER BY r.created_at DESC, r.id DESC
LIMIT $2;

-- @param {String} $1:userId (references users.id)
-- @param {String} $2:hotelId (references hotels.id)
INSERT INTO recently_viewed (user_id, hotel_id, viewed_at)
SELECT u.id, $2::uuid, NOW()
FROM users u
WHERE u.id = $1::uuid
  AND u.role = 'USER'
ON CONFLICT (user_id, hotel_id) DO UPDATE
SET viewed_at = EXCLUDED.viewed_at;
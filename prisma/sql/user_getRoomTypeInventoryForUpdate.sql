-- @param {String}   $1:roomTypeId (room_type_id to filter)
-- @param {DateTime} $2:checkInDate (inclusive start date)
-- @param {DateTime} $3:checkOutDate (exclusive end date)

SELECT
  id,
  date,
  total_rooms   AS "totalRooms",
  booked_rooms  AS "bookedRooms"
FROM room_type_inventories
WHERE room_type_id = $1::uuid
  AND date >= $2
  AND date <  $3
ORDER BY date ASC
FOR UPDATE;

-- Select RoomTypeInventory rows for update (locking) for a given room type and date range.
-- Intended usage within Prisma's transaction when we need to check and update inventory atomically to prevent race conditions.
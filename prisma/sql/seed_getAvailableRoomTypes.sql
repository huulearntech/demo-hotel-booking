-- @param {DateTime} $1:checkInDate
-- @param {DateTime} $2:checkOutDate
-- @param {Int}      $3:numAdults
-- @param {Int}      $4:numChildren
-- @param {Int}      $5:numRooms
-- @param {Int}      $6:pageSize
-- @param {String}   $7:lastHotelId? (pass NULL for first page)

WITH booked_rooms_per_type AS (
  SELECT
    r2.type_id,
    COUNT(DISTINCT r2.id) AS booked_count
  FROM rooms r2
  LEFT JOIN "_BookingToRoom" b2r ON b2r."B" = r2.id
  LEFT JOIN bookings b2 ON b2.id = b2r."A"
  WHERE b2.check_in_date < $2
    AND b2.check_out_date > $1
    AND b2.status IN ('PAID','PENDING_TO_PAY', 'CHECKED_IN')
  GROUP BY r2.type_id
)
SELECT rt.id, rt.name, rt.price
FROM room_types rt
JOIN rooms r ON r.type_id = rt.id
LEFT JOIN booked_rooms_per_type brpt ON brpt.type_id = rt.id
WHERE ($7::uuid IS NULL OR rt.id > $7::uuid)
AND rt.adult_capacity * $5 >= $3
AND (rt.adult_capacity + rt.children_capacity) * $5 >= $3 + $4
GROUP BY rt.id, rt.price, brpt.booked_count
HAVING
  (COUNT(r.id) - COALESCE(brpt.booked_count, 0)) >= $5
ORDER BY rt.id ASC
LIMIT $6
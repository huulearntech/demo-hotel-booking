-- @param {String}   $1:hotelId (references hotels.id)
-- @param {String}   $2:timeRange ("past", "current", "upcoming")
-- @param {Int}      $3:limit
-- @param {DateTime} $4:prevCursorCheckInDate? (use NULL for first page)
-- @param {String}   $5:prevCursorId?          (use NULL for first page)
-- @param {DateTime} $6:nextCursorCheckInDate? (use NULL for first page)
-- @param {String}   $7:nextCursorId?          (use NULL for first page)
-- @param {Boolean}  $8:directionIsNext
WITH base AS (
  SELECT
    b.id,
    b.created_at AS "createdAt",
    b.status,
    b.notes,
    b.customer_name AS "customerName",
    b.customer_email AS "customerEmail",
    b.customer_phone AS "customerPhone",
    b.num_adults AS "numAdults",
    b.num_children AS "numChildren",
    b.num_rooms AS "numRooms",
    b.check_in_date AS "checkInDate",
    b.check_out_date AS "checkOutDate",
    (b.snapshot_room_price * b.num_rooms) AS "totalPrice",
    b.snapshot_room_type_name AS "roomTypeName",
    COUNT(*) OVER() AS "totalCount"
  FROM bookings b
  JOIN room_types rt ON b.room_type_id = rt.id
  WHERE rt.hotel_id = $1::uuid
     AND (
       ($2 = 'past' AND b.status IN ('PAID', 'CHECKED_IN', 'CHECKED_OUT') AND b.check_out_date < now())
       OR ($2 = 'current' AND b.status IN ('PAID', 'CHECKED_IN') AND b.check_in_date <= now() AND b.check_out_date >= now())
       OR ($2 = 'upcoming' AND b.status = 'PAID' AND b.check_in_date > now())
     )
 )
 SELECT
  id,
  "createdAt",
  status,
  notes,
  "customerName",
  "customerEmail",
  "customerPhone",
  "numAdults",
  "numChildren",
  "numRooms",
  "checkInDate",
  "checkOutDate",
  "totalPrice",
  "roomTypeName",
  "totalCount"
FROM base
WHERE (
    ($8 AND $6::date IS NULL)
    OR (NOT $8 AND $4::date IS NULL)
    OR (
      ($8 AND ("checkInDate", id) > ($6::date, $7::uuid))
      OR (NOT $8 AND ("checkInDate", id) < ($4::date, $5::uuid))
    )
)
ORDER BY
  CASE WHEN ($8 OR $4::date IS NULL OR $5::uuid IS NULL) THEN "checkInDate" END ASC,
  CASE WHEN ($8 OR $4::date IS NULL OR $5::uuid IS NULL) THEN id END ASC,
  CASE WHEN NOT ($8 OR $4::date IS NULL OR $5::uuid IS NULL) THEN "checkInDate" END DESC,
  CASE WHEN NOT ($8 OR $4::date IS NULL OR $5::uuid IS NULL) THEN id END DESC
LIMIT $3;

-- TODO: logic for check in check out.
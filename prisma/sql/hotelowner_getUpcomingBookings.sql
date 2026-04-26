-- @param {String} $1:hotelId (references hotels.id)
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
WHERE rt.hotel_id = $1
AND b.status = 'PAID'
AND b.check_in_date >= now()
ORDER BY b.created_at ASC;
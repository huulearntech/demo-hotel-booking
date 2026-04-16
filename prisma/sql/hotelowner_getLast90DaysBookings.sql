-- @param {String} $1:hotelId (references hotels.id)
SELECT
  b.id,
  b.created_at AS "createdAt",
  b.status,
  b.notes,
  b.customer_name AS "customerName",
  b.customer_email AS "customerEmail",
  b.customer_phone AS "customerPhone",
  bm.num_guests AS "numGuests",
  bm.num_rooms AS "numRooms",
  bm.check_in_date AS "checkInDate",
  bm.check_out_date AS "checkOutDate",
  (bm.snapshot_room_price * bm.num_rooms) AS "totalPrice",
  bm.snapshot_room_type_name AS "roomTypeName",
  COUNT(*) OVER() AS "totalCount"
FROM bookings b
JOIN "BookingMetadata" bm ON b.metadata_id = bm.id
WHERE bm.hotel_id = $1
  AND b.created_at >= now() - INTERVAL '90 days'
ORDER BY b.created_at DESC;
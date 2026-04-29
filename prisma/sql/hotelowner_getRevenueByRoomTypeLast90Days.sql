-- @param {String} $1:hotelId (references hotels.id)
SELECT rt.id,
       rt.name,
       COALESCE(SUM(
         b.snapshot_room_price *
         b.num_rooms *
         (b.check_out_date::date - b.check_in_date::date)
       ), 0)::numeric AS "totalRevenue"
FROM room_types rt
JOIN bookings b
  ON b.room_type_id = rt.id
  AND b.created_at >= now() - INTERVAL '90 days'
WHERE rt.hotel_id = $1
  AND b.status IN ('PAID', 'CHECKED_IN', 'CHECKED_OUT')
GROUP BY rt.id
ORDER BY "totalRevenue" DESC;
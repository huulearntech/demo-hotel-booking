-- @param {String} $1:hotelId (references hotels.id)
SELECT rt.name AS room_type_name,
       COALESCE(SUM(bm.snapshot_room_price * bm.num_rooms), 0)::numeric AS total_revenue
FROM room_types rt
LEFT JOIN booking_metadata bm
ON bm.room_type_id = rt.id
AND bm.created_at >= now() - INTERVAL '90 days'
WHERE rt.hotel_id = $1
GROUP BY rt.name
ORDER BY total_revenue DESC;
-- @param {String} $1:hotelId (references hotels.id)
SELECT date_trunc('day', created_at) AS day,
       SUM(snapshot_room_price * num_rooms) AS total_revenue,
       COUNT(id) AS bookings
FROM "BookingMetadata"
WHERE hotel_id = $1
AND created_at >= now() - INTERVAL '90 days'
GROUP BY day
ORDER BY day ASC
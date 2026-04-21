-- @param {String}    $1:hotelId
-- @param {DateTime}  $2:checkInDate
-- @param {DateTime}  $3:checkOutDate
-- @param {Int}       $4:numAdults
-- @param {Int}       $5:numChildren
-- @param {Int}       $6:numRooms
SELECT
  rt.id,
  rt.name,
  rt.price,
  rt.image_urls AS "imageUrls",
  rt.area_m2 AS "areaM2",
  rt.adult_capacity AS "adultCapacity",
  rt.children_capacity AS "childrenCapacity",
  rt.bed_type AS "bedType",
  COALESCE(fac_list.facilities, '[]'::jsonb) AS "facilities"
FROM room_types rt

-- total rooms for this room type (count actual rooms)
LEFT JOIN LATERAL (
  SELECT COUNT(r.id) AS total_rooms
  FROM rooms r
  WHERE r.type_id = rt.id
) tr ON true

-- compute how many rooms are already booked for this room type in the given date range
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(bm.num_rooms), 0) AS booked_rooms
  FROM booking_metadata bm
  RIGHT JOIN bookings b ON b.metadata_id = bm.id
  WHERE bm.room_type_id = rt.id
    -- overlap check for [bm.check_in_date, bm.check_out_date) and [$2, $3)
    AND bm.check_in_date < $3
    AND bm.check_out_date > $2
    AND b.status IN ('PAID', 'PENDING_TO_PAY')
) b ON true

-- aggregate facilities for this room type as a JSONB array of {id, name, iconUrl}
LEFT JOIN LATERAL (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', fac.id, 'name', fac.name, 'iconUrl', fac.icon_url) ORDER BY fac.name), '[]'::jsonb) AS facilities
  FROM "_FacilityToRoomType" f2r
  JOIN facilities fac ON fac.id = f2r."A"
  WHERE f2r."B" = rt.id
) fac_list ON true

WHERE rt.hotel_id = $1
  AND tr.total_rooms - b.booked_rooms >= $6
  AND (
    rt.adult_capacity * $6 >= $4 -- can't treat adult as child
    AND (rt.adult_capacity + rt.children_capacity) * $6 >= $4 + $5 -- but can treat child as adult
  )

ORDER BY rt.name ASC;
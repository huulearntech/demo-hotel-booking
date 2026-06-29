-- @param {String}   $1:userId
-- @param {Int}      $2:pageSize
-- @param {DateTime} $3:cursorViewedAt? (pass NULL for first page)
-- @param {String}   $4:cursorHotelId? (pass NULL for first page)

SELECT
  h.id,
  h.name,
  h.image_urls[1] AS "thumbnailUrl",
  h.rating AS rating,
  h.number_of_reviews AS "numberOfReviews",
  h.type,
  w.name AS "wardName",
  p.name AS "provinceName",
  rv.viewed_at AS "viewedAt",
  available.min_price AS "price", -- only show the min price.
  facility_list.facility_names AS "facilityNames",
  ( $1::uuid IS NOT NULL AND EXISTS (
      SELECT 1
      FROM favorites f
      WHERE f.user_id = $1::uuid
        AND f.hotel_id = h.id
    )) AS "isFavorited"
FROM recently_viewed rv
JOIN hotels h ON h.id = rv.hotel_id
JOIN wards     w ON w.id = h.ward_id
JOIN provinces p ON p.id = w.province_id
LEFT JOIN LATERAL (
  SELECT MIN(rt.price) AS min_price
  FROM room_types rt
  WHERE rt.hotel_id = h.id
) AS available ON true
LEFT JOIN LATERAL (
  SELECT array_agg(fac.name ORDER BY fac.name) AS facility_names
  FROM "_CommonFacilityToHotel" f2h
  JOIN common_facilities fac ON fac.id = f2h."A"
  WHERE f2h."B" = h.id
) AS facility_list ON true
WHERE rv.user_id = $1::uuid
  AND (
    $3::TIMESTAMP IS NULL
    OR (rv.viewed_at, rv.hotel_id) < ($3, $4::uuid)
  )
ORDER BY rv.viewed_at DESC, rv.hotel_id DESC
LIMIT $2;

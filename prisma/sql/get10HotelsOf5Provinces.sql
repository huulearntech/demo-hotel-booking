WITH top5 AS (
  SELECT p.id AS province_id
  FROM hotels h
  JOIN wards     w ON h.ward_id     = w.id
  JOIN provinces p ON w.province_id = p.id
  GROUP BY p.id
  ORDER BY COUNT(*) DESC
  LIMIT 5
),
ranked_hotels AS (
  SELECT
    h.id,
    h.name,
    h.type,
    h.rating,
    h.number_of_reviews,
    h.image_urls[1] AS thumbnail_url,
    w.name AS ward_name,
    p.id AS province_id,
    p.name AS province_name,
    (
      SELECT json_agg(json_build_object('name', f.name))
      FROM facilities f
      JOIN "_FacilityToHotel" fth ON fth."A" = f.id
      WHERE fth."B" = h.id
    ) AS facilities,
    (
      SELECT MIN(rt.price)
      FROM room_types rt
      WHERE rt.hotel_id = h.id
    ) AS min_price,
    ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY h.rating DESC NULLS LAST) AS rn
  FROM hotels h
  JOIN wards     w ON h.ward_id     = w.id
  JOIN provinces p ON w.province_id = p.id
  WHERE p.id IN (SELECT province_id FROM top5)
)
SELECT
  province_id,
  province_name,
  json_agg(
    json_build_object(
      'id', rh.id,
      'name', rh.name,
      'type', rh.type,
      'rating', rh.rating,
      'numberOfReviews', rh.number_of_reviews,
      'facilities', rh.facilities,
      'price', rh.min_price,
      'wardName', rh.ward_name,
      'provinceName', rh.province_name,
      'thumbnailUrl', rh.thumbnail_url
    ) ORDER BY rh.rn
  ) AS hotels
FROM ranked_hotels rh
WHERE rn <= 10
GROUP BY province_id, province_name
ORDER BY province_id;
WITH top5 AS (
  SELECT p.id AS province_id
  FROM hotels h
  JOIN wards     w ON h.ward_id     = w.id
  JOIN districts d ON w.district_id = d.id
  JOIN provinces p ON d.province_id = p.id
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
    COALESCE(array_to_json(h.image_urls), '[]'::json) AS image_urls,
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
  LEFT JOIN wards     w ON h.ward_id     = w.id
  LEFT JOIN districts d ON w.district_id = d.id
  LEFT JOIN provinces p ON d.province_id = p.id
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
      'minPrice', rh.min_price,
      'wardName', rh.ward_name,
      'provinceName', rh.province_name,
      'imageUrls', rh.image_urls
    ) ORDER BY rh.rn
  ) AS hotels
FROM ranked_hotels rh
WHERE rn <= 10
GROUP BY province_id, province_name
ORDER BY province_id;
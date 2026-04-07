-- @param {String}   $1:location
-- @param {DateTime} $2:from
-- @param {DateTime} $3:to
-- @param {Int}      $4:numAdults
-- @param {Int}      $5:numRooms
-- @param {String}   $6:orderBy (e.g. "price_asc", "review_points_desc", etc.)
SELECT
  h.id,
  h.name,
  h.image_urls AS "imageUrls",
  h.review_points AS "reviewPoints",
  h.number_of_reviews AS "numberOfReviews",
  h.type,
  w.name AS "wardName",
  p.name AS "provinceName",
  available.min_price AS "minPrice",
  available.available_count AS "availableCount",
  facility_list.facility_names AS "facilityNames"
FROM hotels h
LEFT JOIN wards     w ON w.id = h."ward_id"
LEFT JOIN districts d ON d.id = w."district_id"
LEFT JOIN provinces p ON p.id = d."province_id"
JOIN LATERAL (
  SELECT
    COUNT(r.id) AS available_count,
    MIN(rt.price) AS min_price,
    MAX(rt.price) AS max_price
  FROM rooms r
  JOIN room_types rt ON rt.id = r.type_id
  WHERE rt.hotel_id = h.id
    AND rt.adult_capacity >= CEIL($4::numeric / NULLIF($5::numeric, 0))
    AND NOT EXISTS (
      SELECT 1
      FROM "_BookingToRoom" b2r
      JOIN bookings b ON b2r."A" = b.id
      -- booking date range now lives in BookingMetadata; join to metadata
      JOIN "BookingMetadata" bm ON b.metadata_id = bm.id
      WHERE b2r."B" = r.id
        -- overlap: booking.start < requested_to AND booking.end > requested_from
        AND bm.check_in_date  < $3
        AND bm.check_out_date > $2
        AND b.status IN ('CONFIRMED', 'PENDING') -- be cautious!
    )
) AS available ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(array_agg(DISTINCT fac.name ORDER BY fac.name), ARRAY[]::text[]) AS facility_names
  FROM "_FacilityToHotel" f2h
  JOIN facilities fac ON fac.id = f2h."A"
  WHERE f2h."B" = h.id
) AS facility_list ON true
WHERE available.available_count >= $5
  -- use Vietnamese full-text search on hotel name and province/ward/district names
  AND (
       to_tsvector_vietnamese(coalesce(h.name, '')) @@ websearch_to_tsquery('vietnamese', unaccent($1))
    OR to_tsvector_vietnamese(coalesce(p.name, '')) @@ websearch_to_tsquery('vietnamese', unaccent($1))
    OR to_tsvector_vietnamese(coalesce(d.name, '')) @@ websearch_to_tsquery('vietnamese', unaccent($1))
    OR to_tsvector_vietnamese(coalesce(w.name, '')) @@ websearch_to_tsquery('vietnamese', unaccent($1))
  )
ORDER BY
  (CASE WHEN $6 = 'price_desc'         THEN available.max_price END) DESC,
  (CASE WHEN $6 = 'price_asc'          THEN available.min_price END) ASC,
  (CASE WHEN $6 = 'review_points_desc' THEN h.review_points     END) DESC,
  h.id ASC -- fallback to deterministic order
;

-- TODO: Pagination, filtering by facilities, review points,...
-- cursor-based pagination can be implemented by adding a WHERE clause that compares the ordering fields to the last seen values from the previous page. For example, if ordering by price_asc, you would add something like:
-- WHERE (available.min_price, h.id) > ($lastMinPrice, $lastHotelId)
-- This ensures that you get the next set of results after the last one from the previous page, based on the same ordering criteria. You would need to adjust the tuple and comparison logic based on the actual ordering fields used.
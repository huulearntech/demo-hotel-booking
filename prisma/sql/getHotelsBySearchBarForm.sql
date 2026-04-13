-- @param {String}   $1:location
-- @param {DateTime} $2:checkInDate
-- @param {DateTime} $3:checkOutDate
-- @param {Int}      $4:numAdults
-- @param {Int}      $5:numRooms
-- @param {Int}      $6:pageSize
-- @param {String}   $7:orderBy (e.g. "price_asc", "price_desc", "review_points_desc")
-- @param {Decimal}  $8:lastPrice? (for price_* orderings; pass NULL for first page)
-- @param {Float}    $9:lastReviewPoints? (for review_points_desc ordering; pass NULL for first page)
-- @param {String}   $10:lastHotelId? (pass NULL for first page)
WITH base AS (
  SELECT
    h.id,
    h.name,
    h.image_urls AS "imageUrls", -- consider selecting only the first image for performance
    h.review_points AS "reviewPoints",
    h.number_of_reviews AS "numberOfReviews",
    h.type,
    w.name AS "wardName",
    p.name AS "provinceName",
    available.min_price AS "minPrice",
    available.max_price AS "maxPrice",
    available.available_count AS "availableCount", -- This is not used.
    facility_list.facility_names AS "facilityNames"
  FROM hotels h
  JOIN wards     w ON w.id = h."ward_id"
  JOIN districts d ON d.id = w."district_id"
  JOIN provinces p ON p.id = d."province_id"
  JOIN LATERAL (
    SELECT
      COUNT(r.id) AS available_count,
      MIN(rt.price) AS min_price,
      MAX(rt.price) AS max_price
      -- TODO: Price filter
    FROM rooms r
    JOIN room_types rt ON rt.id = r.type_id
    WHERE rt.hotel_id = h.id
      AND rt.adult_capacity >= CEIL($4::numeric / NULLIF($5::numeric, 0))
      AND NOT EXISTS (
        SELECT 1
        FROM "_BookingToRoom" b2r
        JOIN bookings b ON b2r."A" = b.id
        LEFT JOIN "BookingMetadata" bm ON b.metadata_id = bm.id -- left join because bookingmetadata may not have booking.
        WHERE b2r."B" = r.id
          AND bm.check_in_date  < $3
          AND bm.check_out_date > $2
          AND b.status IN ('CONFIRMED', 'PENDING')
      )
  ) AS available ON true
  LEFT JOIN LATERAL (
    SELECT COALESCE(array_agg(DISTINCT fac.name ORDER BY fac.name), ARRAY[]::text[]) AS facility_names
    FROM "_FacilityToHotel" f2h
    JOIN facilities fac ON fac.id = f2h."A"
    WHERE f2h."B" = h.id
    -- TODO: Facilities filter
  ) AS facility_list ON true
  WHERE available.available_count >= $5
  AND (
       to_tsvector_vietnamese(coalesce(h.name, '')) @@ websearch_to_tsquery('vietnamese', unaccent($1))
    OR to_tsvector_vietnamese(coalesce(p.name, '')) @@ websearch_to_tsquery('vietnamese', unaccent($1))
    OR to_tsvector_vietnamese(coalesce(d.name, '')) @@ websearch_to_tsquery('vietnamese', unaccent($1))
    OR to_tsvector_vietnamese(coalesce(w.name, '')) @@ websearch_to_tsquery('vietnamese', unaccent($1))
  )
)
SELECT
  b.*,
  (COUNT(*) OVER())::int AS "totalCount"
FROM base b
-- cursor WHERE: only applied when the relevant last-key param for the chosen ordering is NOT NULL
WHERE (
  -- If ordering by price_* and lastPrice ($8) is NULL => first page (allow all)
  ($7 IN ('price_asc', 'price_desc') AND $8::numeric IS NULL)
  -- If ordering by review_points_desc and lastReviewPoints ($9) is NULL => first page (allow all)
  OR ($7 = 'review_points_desc' AND $9::double precision IS NULL)
  -- Otherwise apply cursor comparison for the chosen ordering
  OR ($7 = 'price_asc'          AND (b."minPrice", b.id) > ($8::numeric, $10::text))
  OR ($7 = 'price_desc'         AND (b."maxPrice", b.id) < ($8::numeric, $10::text))
  OR ($7 = 'review_points_desc' AND (b."reviewPoints", b.id) < ($9::double precision, $10::text))

  -- TODO: filter type of hotel (e.g. resort, apartment, etc.)
  -- TODO: filter by rating (e.g. 4 stars and up
)
ORDER BY
  (CASE WHEN $7 = 'price_desc'         THEN b."maxPrice" END) DESC,
  (CASE WHEN $7 = 'price_asc'          THEN b."minPrice" END) ASC,
  (CASE WHEN $7 = 'review_points_desc' THEN b."reviewPoints" END) DESC,
  b.id ASC
LIMIT $6
;
-- TODO: replace location with type_id + type: hotel id + type hotel, district id + type district, etc. to allow more flexible search (e.g. search for hotels in a specific district but not caring about the province)
-- INMAKING: add filter to where clause.
-- start filter being slider will be more reasonable.
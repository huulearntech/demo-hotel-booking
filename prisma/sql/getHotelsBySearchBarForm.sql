-- @param {String}   $1:locationId
-- @param {DateTime} $2:checkInDate
-- @param {DateTime} $3:checkOutDate
-- @param {Int}      $4:numAdults
-- @param {Int}      $5:numRooms
-- @param {Int}      $6:pageSize
-- @param {String}   $7:orderBy (e.g. "price_asc", "price_desc", "review_points_desc")
-- @param {Decimal}  $8:lastPrice? (for price_* orderings; pass NULL for first page)
-- @param {Float}    $9:lastReviewPoints? (for review_points_desc ordering; pass NULL for first page)
-- @param {String}   $10:lastHotelId? (pass NULL for first page)
-- @param {String}   $11:locationType (e.g. "ward", "district", "province")
-- @param {Decimal}  $12:minPrice (filter)
-- @param {Decimal}  $13:maxPrice (filter)
-- @param {Int}      $16:numChildren (TODO: temporarily put this at the end.)
WITH base AS (
  SELECT
    h.id,
    h.name,
    h.image_urls[1] AS "thumbnailUrl",
    h.review_points AS "reviewPoints",
    h.number_of_reviews AS "numberOfReviews",
    h.type,
    w.name AS "wardName",
    p.name AS "provinceName",
    available.min_price AS "minPrice",
    available.max_price AS "maxPrice",
    facility_list.facility_names AS "facilityNames"
  FROM hotels h
  JOIN wards     w ON w.id = h.ward_id
  JOIN districts d ON d.id = w.district_id
  JOIN provinces p ON p.id = d.province_id
  JOIN LATERAL (
    -- changed: group and HAVING so no rows are returned when no room types are available
    SELECT
      MIN(rt_count.rt_price) AS min_price,
      MAX(rt_count.rt_price) AS max_price
    FROM (
      SELECT rt.id AS rt_id, rt.price AS rt_price, COUNT(r.id) AS total_rooms
      FROM room_types rt
      JOIN rooms r ON r.type_id = rt.id
      WHERE rt.hotel_id = h.id
        AND rt.price BETWEEN $12 AND $13
        AND rt.adult_capacity * $5 >= $4
        AND (rt.adult_capacity + rt.children_capacity) * $5 >= $4 + $16
      GROUP BY rt.id, rt.price
      HAVING
        -- ensure enough unbooked rooms for this type
        (COUNT(r.id) - COALESCE(
          (
            SELECT COUNT(DISTINCT r2.id)
            FROM rooms r2
            JOIN "_BookingToRoom" b2r ON b2r."B" = r2.id
            JOIN bookings b2 ON b2.id = b2r."A"
            LEFT JOIN booking_metadata bm2 ON b2.metadata_id = bm2.id
            WHERE bm2.check_in_date < $3
              AND bm2.check_out_date > $2
              AND b2.status IN ('CONFIRMED','PENDING')
              AND r2.type_id = rt.id
          ), 0
        )) >= $5
    ) rt_count
  ) AS available ON true
  LEFT JOIN LATERAL (
    SELECT COALESCE(array_agg(fac.name), ARRAY[]::text[]) AS facility_names
    FROM "_FacilityToHotel" f2h
    JOIN facilities fac ON fac.id = f2h."A"
    WHERE f2h."B" = h.id
  ) AS facility_list ON true
  WHERE ( -- prisma cuid -> postgres text.
       ($11 = 'ward'     AND w.id = $1)
    OR ($11 = 'district' AND d.id = $1)
    OR ($11 = 'province' AND p.id = $1)
  )
  AND ( -- hotel type filter
    $15::"HotelType"[] IS NULL
    OR cardinality($15::"HotelType"[]) = 0
    OR h.type = ANY($15::"HotelType"[])
  )
  AND ( -- facility filter
    $14::text[] IS NULL
    OR cardinality($14::text[]) = 0
    OR facility_list.facility_names && $14::text[]
  ) -- TODO: rating filter
)
SELECT
  b.*,
  (COUNT(*) OVER())::int AS "totalCount"
FROM base b
-- cursor WHERE: only applied when not on first page (i.e. when lastPrice/lastReviewPoints/lastHotelId is not null).
WHERE b."minPrice" IS NOT NULL -- available count > 0
AND (
  ($7 IN ('price_asc', 'price_desc') AND $8::numeric IS NULL)
  OR ($7 = 'review_points_desc' AND $9::double precision IS NULL)
  -- Otherwise apply cursor comparison for the chosen ordering
  OR ($7 = 'price_asc'          AND (b."minPrice", b.id) > ($8::numeric, $10::text))
  OR ($7 = 'price_desc'         AND (b."maxPrice", b.id) < ($8::numeric, $10::text))
  OR ($7 = 'review_points_desc' AND (b."reviewPoints", b.id) < ($9::double precision, $10::text))
)
ORDER BY
  (CASE WHEN $7 = 'price_desc'         THEN b."maxPrice" END) DESC,
  (CASE WHEN $7 = 'price_asc'          THEN b."minPrice" END) ASC,
  (CASE WHEN $7 = 'review_points_desc' THEN b."reviewPoints" END) DESC,
  b.id ASC
LIMIT $6
;
-- $14:facilityNames (prisma doesnot support array, so just treat it as normal sql param)
-- $15:hotelTypes (e.g. resort, apartment, etc.) (prisma doesnot support array, so just treat it as normal sql param)
-- @param {String}   $1:locationId
-- @param {DateTime} $2:checkInDate
-- @param {DateTime} $3:checkOutDate
-- @param {Int}      $4:numAdults
-- @param {Int}      $5:numRooms
-- @param {Int}      $6:pageSize
-- @param {String}   $7:orderBy (e.g. "price_asc", "price_desc", "rating_desc")
-- @param {Decimal}  $8:lastPrice? (for price_* orderings; pass NULL for first page)
-- @param {Float}    $9:lastReviewPoints? (for rating_desc ordering; pass NULL for first page)
-- @param {String}   $10:lastHotelId? (pass NULL for first page)
-- @param {String}   $11:locationType (e.g. "ward", "province")
-- @param {Decimal}  $12:minPrice (filter)
-- @param {Decimal}  $13:maxPrice (filter)
-- @param {Int}      $16:numChildren (NOTE: temporarily put this at the end.)
-- @param {String}   $17:userId? (for favorite)
-- @param {Int}      $18:minRating
-- @param {Int}      $19:maxRating

-- TODO: should join with inventory instead of rooms.
WITH base AS (
  SELECT
    h.id,
    h.name,
    h.image_urls[1] AS "thumbnailUrl",
    h.rating AS rating,
    h.number_of_reviews AS "numberOfReviews",
    h.type,
    w.name AS "wardName",
    p.name AS "provinceName",
    available.min_price AS "minPrice",
    available.max_price AS "maxPrice",
    facility_list.facility_names AS "facilityNames",
    ( $17::uuid IS NOT NULL AND EXISTS (
      SELECT 1
      FROM favorites f
      WHERE f.user_id = $17::uuid
        AND f.hotel_id = h.id
    )) AS "isFavorited"
  FROM hotels h
  JOIN wards     w ON w.id = h.ward_id
  JOIN provinces p ON p.id = w.province_id
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
            LEFT JOIN "_BookingToRoom" b2r ON b2r."B" = r2.id
            LEFT JOIN bookings b2 ON b2.id = b2r."A"
            WHERE b2.check_in_date < $3
              AND b2.check_out_date > $2
              AND b2.status IN ('PAID','PENDING_TO_PAY', 'CHECKED_IN')
              AND r2.type_id = rt.id
          ), 0
        )) >= $5
    ) rt_count
  ) AS available ON true
  JOIN LATERAL (
    SELECT COALESCE(array_agg(fac.name), ARRAY[]::text[]) AS facility_names
    FROM "_CommonFacilityToHotel" f2h
    JOIN common_facilities fac ON fac.id = f2h."A"
    WHERE f2h."B" = h.id
  ) AS facility_list ON true
  WHERE ( -- prisma cuid -> postgres text.
       ($11 = 'ward'     AND w.id = $1)
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
  )
  AND h.rating BETWEEN $18 AND $19
)
SELECT
  b.*,
  (COUNT(*) OVER())::int AS "totalCount"
FROM base b
-- only applied when not on first page
WHERE b."minPrice" IS NOT NULL
AND (
  ($7 IN ('price_asc', 'price_desc') AND $8::numeric IS NULL)
  OR ($7 = 'rating_desc' AND $9::double precision IS NULL)
  -- Otherwise apply cursor comparison for the chosen ordering
  OR ($7 = 'price_asc'          AND (b."minPrice", b.id) > ($8::numeric, $10::uuid))
  OR ($7 = 'price_desc'         AND (b."maxPrice", b.id) < ($8::numeric, $10::uuid))
  OR ($7 = 'rating_desc' AND (b.rating, b.id) < ($9::double precision, $10::uuid))
)
ORDER BY
  (CASE WHEN $7 = 'price_desc'         THEN b."maxPrice" END) DESC,
  (CASE WHEN $7 = 'price_asc'          THEN b."minPrice" END) ASC,
  (CASE WHEN $7 = 'rating_desc' THEN b.rating END) DESC,
  b.id ASC
LIMIT $6
;
-- $14:facilityNames (prisma doesnot support array, so just treat it as normal sql param)
-- $15:hotelTypes (array of: resort, apartment, etc.)
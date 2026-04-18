-- @param {DateTime} $1:checkInDate
-- @param {DateTime} $2:checkOutDate
-- @param {Int}      $3:numAdults
-- @param {Int}      $4:numRooms
-- @param {Int}      $5:pageSize

-- @param {Float}    $6:northBound
-- @param {Float}    $7:southBound
-- @param {Float}    $8:westBound
-- @param {Float}    $9:eastBound

-- @param {Decimal}  $10:minPrice (filter)
-- @param {Decimal}  $11:maxPrice (filter)
-- @param {Int}      $14:numChildren (TODO: temporarily put this at the end.)

-- TODO: Check this
WITH available AS (
  SELECT t.hotel_id, MIN(t.price) AS min_price
  FROM (
    SELECT
      rt.hotel_id,
      rt.id AS room_type_id,
      rt.price,
      COUNT(r.id) AS total_rooms,
      -- count distinct rooms that are booked in the requested date window and statuses
      COUNT(DISTINCT CASE
        WHEN bm.check_in_date < $2
         AND bm.check_out_date > $1
         AND b.status IN ('CONFIRMED','PENDING')
        THEN r.id
      END) AS booked_rooms
    FROM room_types rt
    JOIN rooms r ON r.type_id = rt.id
    LEFT JOIN "_BookingToRoom" b2r ON b2r."B" = r.id
    LEFT JOIN bookings b ON b.id = b2r."A"
    LEFT JOIN booking_metadata bm ON bm.id = b.metadata_id
    WHERE rt.price BETWEEN $10 AND $11
      AND rt.adult_capacity * $4 >= $3
      AND (rt.adult_capacity + rt.children_capacity) * $4 >= $3 + $14
    GROUP BY rt.hotel_id, rt.id, rt.price
    HAVING COUNT(r.id) - COUNT(DISTINCT CASE
      WHEN bm.check_in_date < $2
       AND bm.check_out_date > $1
       AND b.status IN ('CONFIRMED','PENDING')
      THEN r.id END) >= $4
  ) AS t
  GROUP BY t.hotel_id
)
SELECT
  h.id,
  h.name,
  h.image_urls[1] AS "thumbnailUrl",
  h.review_points AS "reviewPoints",
  h.number_of_reviews AS "numberOfReviews",
  available.min_price AS "price",
  h.latitude,
  h.longitude
FROM hotels h
JOIN available ON available.hotel_id = h.id
WHERE
  -- latitude between south and north
  h.latitude BETWEEN $7::double precision AND $6::double precision
  AND (
    -- normal case or antimeridian wrapped box
    ($8::double precision <= $9::double precision AND h.longitude BETWEEN $8::double precision AND $9::double precision)
    OR ($8::double precision > $9::double precision AND (h.longitude >= $8::double precision OR h.longitude <= $9::double precision))
  )
  AND (
    $13::"HotelType"[] IS NULL
    OR cardinality($13::"HotelType"[]) = 0
    OR h.type = ANY($13::"HotelType"[])
  )
  AND (
    $12::text[] IS NULL
    OR cardinality($12::text[]) = 0
    OR EXISTS (
      SELECT 1
      FROM "_FacilityToHotel" f2h
      JOIN facilities fac ON fac.id = f2h."A"
      WHERE f2h."B" = h.id
        AND fac.name = ANY($12::text[])
    )
  )
ORDER BY available.min_price ASC NULLS LAST, h.id ASC
LIMIT $5;

-- $12:facilityNames (prisma doesnot support array, so just treat it as normal sql param)
-- $13:hotelTypes (e.g. resort, apartment, etc.) (prisma doesnot support array, so just treat it as normal sql param)

-- FIXME: Don't have any idea why it complains about nonexisted table???
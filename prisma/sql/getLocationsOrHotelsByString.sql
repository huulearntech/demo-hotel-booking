-- @param {String} $1:searchString - The string to search for in location names.
-- @param {Float}  $2:similarityThreshold
WITH locations AS (
  SELECT * FROM (
    SELECT
      h.id,
      h.name,
      'hotel' AS type,
      w.name AS ward_name,
      p.name AS province_name,
      similarity(unaccent(lower(h.name)), unaccent(lower($1))) AS sim
    FROM hotels h
    LEFT JOIN wards w ON w.id = h.ward_id
    LEFT JOIN provinces p ON p.id = w.province_id
    WHERE h.name IS NOT NULL AND h.name <> ''
    ORDER BY sim DESC
    LIMIT 10
  ) t
  UNION ALL
  SELECT * FROM (
    SELECT
      p.id,
      p.name,
      'province' AS type,
      NULL::text AS ward_name,
      NULL::text AS province_name,
      similarity(unaccent(lower(p.name)), unaccent(lower($1))) AS sim
    FROM provinces p
    WHERE p.name IS NOT NULL AND p.name <> ''
    ORDER BY sim DESC
    LIMIT 10
  ) t
  UNION ALL
  SELECT * FROM (
    SELECT
      w.id,
      w.name,
      'ward' AS type,
      NULL::text AS ward_name,
      p.name AS province_name,
      similarity(unaccent(lower(w.name)), unaccent(lower($1))) AS sim
    FROM wards w
    LEFT JOIN provinces p ON p.id = w.province_id
    WHERE w.name IS NOT NULL AND w.name <> ''
    ORDER BY sim DESC
    LIMIT 10
  ) t
)
SELECT id, name, type, ward_name, province_name
FROM locations
WHERE sim >= COALESCE($2::double precision, 0.2)
ORDER BY sim DESC, name
LIMIT 10;
-- TODO: select the actual type of the thing.
-- @param {String} $1:searchString - The string to search for in location names.
-- @param {Float}  $2:similarityThreshold
WITH locations AS (
  SELECT id, name, 'hotel' AS type,
    similarity(unaccent(lower(name)), unaccent(lower($1))) AS sim
  FROM hotels
  UNION ALL
  SELECT id, name, 'province' AS type,
    similarity(unaccent(lower(name)), unaccent(lower($1))) AS sim
  FROM provinces
  UNION ALL
  SELECT id, name, 'district' AS type,
    similarity(unaccent(lower(name)), unaccent(lower($1))) AS sim
  FROM districts
  UNION ALL
  SELECT id, name, 'ward' AS type,
    similarity(unaccent(lower(name)), unaccent(lower($1))) AS sim
  FROM wards
)
SELECT id, name, type
FROM locations
WHERE sim >= COALESCE($2::double precision, 0.2)
ORDER BY sim DESC, name
LIMIT 10;
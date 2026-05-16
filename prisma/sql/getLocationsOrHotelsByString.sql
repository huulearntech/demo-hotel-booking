-- @param {String} $1:searchString - The string to search for in location names.
-- @param {Float}  $2:similarityThreshold
WITH locations AS (
  SELECT * FROM (
    SELECT id, name, 'hotel' AS type,
      similarity(unaccent(lower(name)), unaccent(lower($1))) AS sim
    FROM hotels
    WHERE name IS NOT NULL AND name <> ''
    ORDER BY sim DESC
    LIMIT 10
  ) t
  UNION ALL
  SELECT * FROM (
    SELECT id, name, 'province' AS type,
      similarity(unaccent(lower(name)), unaccent(lower($1))) AS sim
    FROM provinces
    WHERE name IS NOT NULL AND name <> ''
    ORDER BY sim DESC
    LIMIT 10
  ) t
  UNION ALL
  SELECT * FROM (
    SELECT id, name, 'ward' AS type,
      similarity(unaccent(lower(name)), unaccent(lower($1))) AS sim
    FROM wards
    WHERE name IS NOT NULL AND name <> ''
    ORDER BY sim DESC
    LIMIT 10
  ) t
)
SELECT id, name, type
FROM locations
WHERE sim >= COALESCE($2::double precision, 0.2)
ORDER BY sim DESC, name
LIMIT 10;
-- TODO: select the actual type of the thing.
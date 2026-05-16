-- Cleaned migration: consolidate duplicated logic between Part 1 and Part 2
-- Install extensions used for normalization and similarity (once)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create an unaccent dictionary for use in text search, and a vietnamese text search config.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_ts_dict WHERE dictname = 'unaccent_vn') THEN
    CREATE TEXT SEARCH DICTIONARY unaccent_vn ( TEMPLATE = unaccent, RULES = 'unaccent' );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_ts_config WHERE cfgname = 'vietnamese') THEN
    CREATE TEXT SEARCH CONFIGURATION vietnamese ( COPY = pg_catalog.simple );
  END IF;

  -- Map word-like tokens to the unaccent dictionary then simple (to allow minimal stemming/normalization)
  ALTER TEXT SEARCH CONFIGURATION vietnamese
    ALTER MAPPING FOR hword, hword_part, word WITH unaccent_vn, simple;
END
$$ LANGUAGE plpgsql;


-- Convenience function: normalize (unaccent) then to_tsvector using vietnamese config if available.
-- Marked STABLE because it calls non-immutable unaccent().
CREATE OR REPLACE FUNCTION public.to_tsvector_vietnamese(input text)
RETURNS tsvector
LANGUAGE plpgsql
STABLE
STRICT
AS $$
DECLARE
  cfg_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_ts_config WHERE cfgname = 'vietnamese') INTO cfg_exists;
  IF cfg_exists THEN
    RETURN to_tsvector('vietnamese', coalesce(unaccent(input), ''));
  ELSE
    RETURN to_tsvector(coalesce(unaccent(input), ''));
  END IF;
END;
$$;


-- Example table prepared for Vietnamese full-text search.
CREATE TABLE IF NOT EXISTS documents_vn (
  id bigserial PRIMARY KEY,
  title text,
  body text,
  search_vector tsvector
);

-- Trigger function to update search_vector on INSERT/UPDATE using the consolidated helper.
CREATE OR REPLACE FUNCTION public.documents_vn_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector_vietnamese(coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector_vietnamese(coalesce(NEW.body, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_vn_search_vector_trigger ON documents_vn;
CREATE TRIGGER documents_vn_search_vector_trigger
BEFORE INSERT OR UPDATE ON documents_vn
FOR EACH ROW EXECUTE FUNCTION public.documents_vn_search_vector_update();

-- GIN index for fast full-text search on documents_vn
CREATE INDEX IF NOT EXISTS idx_documents_vn_search_vector ON documents_vn USING GIN (search_vector);

-- Optional: trigram indexes on raw text for ILIKE / similarity searches
CREATE INDEX IF NOT EXISTS idx_documents_vn_title_trgm ON documents_vn USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_vn_body_trgm ON documents_vn USING GIN (body gin_trgm_ops);


-- Reusable trigger function that uses the consolidated to_tsvector_vietnamese helper.
CREATE OR REPLACE FUNCTION public.update_name_tsv() RETURNS trigger AS $$
BEGIN
  NEW.name_tsv := to_tsvector_vietnamese(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For the set of lookup tables, add/maintain a name_tsv column, populate it, index it and attach the trigger.
DO $$
DECLARE
  tbl text;
  idx text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['hotels', 'wards', 'provinces']) LOOP
    -- add column if not exists
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS name_tsv tsvector;', tbl);

    -- populate existing rows (only where name is not null)
    EXECUTE format('UPDATE %I SET name_tsv = to_tsvector_vietnamese(name) WHERE name IS NOT NULL;', tbl);

    -- create index on the tsvector column
    idx := format('%s_name_tsv_idx', tbl);
    IF NOT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = idx
    ) THEN
      EXECUTE format('CREATE INDEX %I ON %I USING GIN (name_tsv);', idx, tbl);
    END IF;

    -- recreate trigger to maintain name_tsv
    EXECUTE format('DROP TRIGGER IF EXISTS %I_update_name_tsv ON %I;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER %I_update_name_tsv BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.update_name_tsv();',
      tbl, tbl
    );
  END LOOP;
END
$$ LANGUAGE plpgsql;

-- Self-hosted schema for AstroForge (replaces the former Supabase project).
-- Applied automatically by Postgres on first container start
-- (mounted into /docker-entrypoint-initdb.d/).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sector text NOT NULL,
  brief text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  plan jsonb,
  seo_score int,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sites_user_id_idx ON sites(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS site_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'image',
  slot text,
  prompt text,
  storage_path text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_assets_site_idx ON site_assets(site_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sites_updated_at ON sites;
CREATE TRIGGER sites_updated_at BEFORE UPDATE ON sites
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

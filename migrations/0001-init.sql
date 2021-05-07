CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE storage.files (
  id uuid DEFAULT public.gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  filename text NOT NULL,
  access_token uuid UNIQUE NOT NULL,
  size int NOT NULL,
  mimetype text,
  uploaded_by_ip_address text NOT NULL
);

CREATE TRIGGER set_storage_files_updated_at BEFORE
UPDATE
  ON storage.files FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "photo_paths" text[] NOT NULL DEFAULT '{}';
ALTER TABLE "recipes" DROP COLUMN IF EXISTS "photo_path";

-- Shared food memories ("notes"). user_id is who may edit; author_name is the
-- editable signature. Notes outlive a deleted account or recipe.
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  body text NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memories_created_at_idx ON memories (created_at DESC);

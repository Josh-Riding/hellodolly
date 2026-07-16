CREATE TYPE user_role AS ENUM ('admin', 'member');

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  username text NOT NULL UNIQUE,
  password_hash text,
  role user_role NOT NULL DEFAULT 'member',
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

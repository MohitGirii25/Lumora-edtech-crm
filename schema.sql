-- The application connects directly from its backend using DATABASE_URL.
-- Keep these tables inaccessible through Supabase's client Data API.
CREATE TABLE IF NOT EXISTS admins (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Preserve administrator accounts created by older versions of this project.
DO $$
BEGIN
    IF to_regclass('public.users') IS NOT NULL THEN
        INSERT INTO admins (name, email, password_hash)
        SELECT name, LOWER(email), password_hash FROM users
        ON CONFLICT (email) DO NOTHING;
        PERFORM setval(pg_get_serial_sequence('admins', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM admins), 1), 1), EXISTS (SELECT 1 FROM admins));
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS inquiries (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(160) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(24) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('PARENT','STUDENT','SCHOOL')),
    category VARCHAR(24) NOT NULL CHECK (category IN ('SCHOLARSHIP','CONCERT','ADMISSION','GENERAL_QUERY')),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','IN_PROGRESS','RESOLVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_category ON inquiries(category);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_type ON inquiries(user_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE admins FROM PUBLIC;
REVOKE ALL ON TABLE inquiries FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL ON TABLE admins FROM anon';
        EXECUTE 'REVOKE ALL ON TABLE inquiries FROM anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL ON TABLE admins FROM authenticated';
        EXECUTE 'REVOKE ALL ON TABLE inquiries FROM authenticated';
    END IF;
END
$$;

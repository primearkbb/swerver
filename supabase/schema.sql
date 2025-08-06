-- 1. Create tables (won't error if exists)
CREATE TABLE IF NOT EXISTS destination_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS destination_code_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_code_id UUID REFERENCES destination_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'destination_code_shares_destination_code_id_user_id_key'
  ) THEN
    ALTER TABLE destination_code_shares
    ADD CONSTRAINT destination_code_shares_destination_code_id_user_id_key
    UNIQUE(destination_code_id, user_id);
  END IF;
END $$;

-- 3. Create indexes (won't error if exists)
CREATE INDEX IF NOT EXISTS idx_destination_codes_code
  ON destination_codes(code) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_shares_code_user
  ON destination_code_shares(destination_code_id, user_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_shares_public
  ON destination_code_shares(destination_code_id) WHERE is_public = true AND active = true;
CREATE INDEX IF NOT EXISTS idx_shares_expires
  ON destination_code_shares(expires_at) WHERE expires_at IS NOT NULL;

-- 4. Enable RLS (safe to re-run)
ALTER TABLE destination_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_code_shares ENABLE ROW LEVEL SECURITY;

-- 5. Create or replace policies
DROP POLICY IF EXISTS "Service role can manage all destination codes" ON destination_codes;
CREATE POLICY "Service role can manage all destination codes"
  ON destination_codes FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage all shares" ON destination_code_shares;
CREATE POLICY "Service role can manage all shares"
  ON destination_code_shares FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Insert test data only if not exists
INSERT INTO destination_codes (code, destination_url)
VALUES ('abc123', 'https://example.com')
ON CONFLICT (code) DO NOTHING;

-- Insert public share only if code exists and share doesn't
INSERT INTO destination_code_shares (destination_code_id, is_public)
SELECT id, true FROM destination_codes WHERE code = 'abc123'
ON CONFLICT DO NOTHING;

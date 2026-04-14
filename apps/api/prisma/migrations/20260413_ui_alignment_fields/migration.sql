ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT;

ALTER TABLE "Asset"
  ADD COLUMN IF NOT EXISTS "os" TEXT,
  ADD COLUMN IF NOT EXISTS "cpu" TEXT,
  ADD COLUMN IF NOT EXISTS "memory" TEXT,
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Problem"
  ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserSettings_username_fkey'
  ) THEN
    ALTER TABLE "UserSettings"
      ADD CONSTRAINT "UserSettings_username_fkey"
      FOREIGN KEY ("username") REFERENCES "User"("username")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

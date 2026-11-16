CREATE TABLE IF NOT EXISTS "RateLimit" (
  "key" TEXT PRIMARY KEY NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS "RateLimit_resetAt_idx" ON "RateLimit" ("resetAt");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_memberId_date_idx" ON "AttendanceRecord" ("memberId", "date");
CREATE INDEX IF NOT EXISTS "Membership_memberId_endDate_idx" ON "Membership" ("memberId", "endDate");
CREATE INDEX IF NOT EXISTS "Payment_memberId_date_idx" ON "Payment" ("memberId", "date");
CREATE INDEX IF NOT EXISTS "QrToken_isActive_idx" ON "QrToken" ("isActive");

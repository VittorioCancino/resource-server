-- Rename the old session table to the new domain table name
ALTER TABLE "AttendanceSession" RENAME TO "SessionAttendance";

-- Keep primary and foreign key names aligned after the table rename
ALTER TABLE "SessionAttendance" RENAME CONSTRAINT "AttendanceSession_pkey" TO "SessionAttendance_pkey";
ALTER TABLE "SessionAttendance" RENAME CONSTRAINT "AttendanceSession_labId_fkey" TO "SessionAttendance_labId_fkey";
ALTER TABLE "SessionAttendance" RENAME CONSTRAINT "AttendanceSession_userId_fkey" TO "SessionAttendance_userId_fkey";

-- Migrate existing columns to session entry/exit semantics
ALTER TABLE "SessionAttendance" RENAME COLUMN "sessionStart" TO "entryAt";
ALTER TABLE "SessionAttendance" RENAME COLUMN "sessionEnd" TO "exitAt";
ALTER TABLE "SessionAttendance" RENAME COLUMN "firstEventId" TO "entryEventId";
ALTER TABLE "SessionAttendance" RENAME COLUMN "lastEventId" TO "exitEventId";
ALTER TABLE "SessionAttendance" RENAME COLUMN "totalMinutes" TO "durationMinutes";

-- Remove session state field and keep logical open/close from exit event
ALTER TABLE "SessionAttendance" DROP COLUMN "status";

-- Align renamed columns with the current Prisma model
ALTER TABLE "SessionAttendance"
  ALTER COLUMN "entryEventId" SET NOT NULL,
  ALTER COLUMN "eventCount" SET DEFAULT 1;

-- Keep indexes aligned with current query patterns
ALTER INDEX "AttendanceSession_labId_userId_idx" RENAME TO "SessionAttendance_labId_userId_idx";
ALTER INDEX "AttendanceSession_sessionStart_idx" RENAME TO "SessionAttendance_entryAt_idx";

-- Create FK for entry and exit event mapping
ALTER TABLE "SessionAttendance"
  ADD CONSTRAINT "SessionAttendance_entryEventId_fkey"
  FOREIGN KEY ("entryEventId") REFERENCES "AttendanceEvent"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SessionAttendance"
  ADD CONSTRAINT "SessionAttendance_exitEventId_fkey"
  FOREIGN KEY ("exitEventId") REFERENCES "AttendanceEvent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Ensure each event is linked to at most one open/closed session row
CREATE UNIQUE INDEX "SessionAttendance_entryEventId_key" ON "SessionAttendance"("entryEventId");
CREATE UNIQUE INDEX "SessionAttendance_exitEventId_key" ON "SessionAttendance"("exitEventId");

-- Remove enum that is no longer used after replacing AttendanceSession status
DROP TYPE "AttendanceSessionStatus";

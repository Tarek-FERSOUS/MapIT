-- Create enums for incident lifecycle and priority
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED');
CREATE TYPE "IncidentPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Add lifecycle and assignment fields
ALTER TABLE "Incident"
  ADD COLUMN "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "priority" "IncidentPriority" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "assignedTeam" TEXT,
  ADD COLUMN "assignedToUserId" TEXT;

-- Add foreign key and index for assignee lookups
ALTER TABLE "Incident"
  ADD CONSTRAINT "Incident_assignedToUserId_fkey"
  FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Incident_assignedToUserId_idx" ON "Incident"("assignedToUserId");

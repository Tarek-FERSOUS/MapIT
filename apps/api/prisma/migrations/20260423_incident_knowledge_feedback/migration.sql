CREATE TABLE "IncidentKnowledgeFeedback" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentKnowledgeFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IncidentKnowledgeFeedback_incidentId_sourceType_sourceId_userId_key" ON "IncidentKnowledgeFeedback"("incidentId", "sourceType", "sourceId", "userId");
CREATE INDEX "IncidentKnowledgeFeedback_incidentId_idx" ON "IncidentKnowledgeFeedback"("incidentId");
CREATE INDEX "IncidentKnowledgeFeedback_sourceType_sourceId_idx" ON "IncidentKnowledgeFeedback"("sourceType", "sourceId");
CREATE INDEX "IncidentKnowledgeFeedback_userId_idx" ON "IncidentKnowledgeFeedback"("userId");

ALTER TABLE "IncidentKnowledgeFeedback"
  ADD CONSTRAINT "IncidentKnowledgeFeedback_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IncidentKnowledgeFeedback"
  ADD CONSTRAINT "IncidentKnowledgeFeedback_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

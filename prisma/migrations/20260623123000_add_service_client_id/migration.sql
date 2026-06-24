-- Store the Hydra OAuth client identifier on every registered service.
ALTER TABLE "Service" ADD COLUMN "clientId" TEXT;

-- Existing services were historically identified only by key. Preserve them by
-- using the key as their local client id until they self-register explicitly.
UPDATE "Service" SET "clientId" = "key" WHERE "clientId" IS NULL;

ALTER TABLE "Service" ALTER COLUMN "clientId" SET NOT NULL;

CREATE UNIQUE INDEX "Service_clientId_key" ON "Service"("clientId");

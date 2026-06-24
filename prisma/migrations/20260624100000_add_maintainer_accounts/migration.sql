-- Service-owned bootstrap accounts used by login flows before a human user has
-- been enrolled into the service.
CREATE TABLE "MaintainerAccount" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintainerAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaintainerAccount_serviceId_key" ON "MaintainerAccount"("serviceId");

CREATE UNIQUE INDEX "MaintainerAccount_subject_key" ON "MaintainerAccount"("subject");

CREATE UNIQUE INDEX "MaintainerAccount_serviceId_email_key" ON "MaintainerAccount"("serviceId", "email");

ALTER TABLE "MaintainerAccount" ADD CONSTRAINT "MaintainerAccount_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Use Service as the shared authorization domain for applications and laboratories.
CREATE TYPE "ServiceType" AS ENUM ('APPLICATION', 'LABORATORY');

ALTER TABLE "Service" ADD COLUMN "type" "ServiceType" NOT NULL DEFAULT 'APPLICATION';

-- Every laboratory receives a backing service for roles, memberships, and invitations.
ALTER TABLE "Laboratory" ADD COLUMN "serviceId" TEXT;

INSERT INTO "Service" ("id", "key", "name", "type")
SELECT
    "id",
    'lab:' || lower(regexp_replace(trim("code"), '[[:space:]]+', '-', 'g')),
    "name",
    'LABORATORY'::"ServiceType"
FROM "Laboratory"
ON CONFLICT ("key") DO NOTHING;

UPDATE "Laboratory"
SET "serviceId" = "Service"."id"
FROM "Service"
WHERE "Service"."key" = 'lab:' || lower(regexp_replace(trim("Laboratory"."code"), '[[:space:]]+', '-', 'g'));

ALTER TABLE "Laboratory" ALTER COLUMN "serviceId" SET NOT NULL;

CREATE UNIQUE INDEX "Laboratory_serviceId_key" ON "Laboratory"("serviceId");

ALTER TABLE "Laboratory" ADD CONSTRAINT "Laboratory_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve existing laboratory roles as service roles.
INSERT INTO "ServiceRole" ("id", "serviceId", "name")
SELECT "LaboratoryRole"."id", "Laboratory"."serviceId", "LaboratoryRole"."name"
FROM "LaboratoryRole"
INNER JOIN "Laboratory" ON "Laboratory"."id" = "LaboratoryRole"."laboratoryId"
ON CONFLICT ("serviceId", "name") DO NOTHING;

-- Ensure lab-backed services have the default application-style roles too.
INSERT INTO "ServiceRole" ("id", "serviceId", "name")
SELECT "serviceId" || ':role:admin', "serviceId", 'admin'
FROM "Laboratory"
ON CONFLICT ("serviceId", "name") DO NOTHING;

INSERT INTO "ServiceRole" ("id", "serviceId", "name")
SELECT "serviceId" || ':role:user', "serviceId", 'user'
FROM "Laboratory"
ON CONFLICT ("serviceId", "name") DO NOTHING;

-- Move lab memberships into generic service memberships.
INSERT INTO "UserServiceMembership" ("userId", "serviceId")
SELECT "UserLaboratoryMembership"."userId", "Laboratory"."serviceId"
FROM "UserLaboratoryMembership"
INNER JOIN "Laboratory" ON "Laboratory"."id" = "UserLaboratoryMembership"."laboratoryId"
ON CONFLICT DO NOTHING;

INSERT INTO "UserServiceMembershipRole" ("userId", "serviceId", "serviceRoleId")
SELECT "UserLaboratoryMembershipRole"."userId", "Laboratory"."serviceId", "ServiceRole"."id"
FROM "UserLaboratoryMembershipRole"
INNER JOIN "LaboratoryRole" ON "LaboratoryRole"."id" = "UserLaboratoryMembershipRole"."laboratoryRoleId"
INNER JOIN "Laboratory" ON "Laboratory"."id" = "LaboratoryRole"."laboratoryId"
INNER JOIN "ServiceRole" ON "ServiceRole"."serviceId" = "Laboratory"."serviceId" AND "ServiceRole"."name" = "LaboratoryRole"."name"
ON CONFLICT DO NOTHING;

-- Registration invitations now target a service. Lab routes resolve through Laboratory.serviceId.
ALTER TABLE "UserRegistrationInvitation" ADD COLUMN "serviceId" TEXT;

UPDATE "UserRegistrationInvitation"
SET "serviceId" = "Laboratory"."serviceId"
FROM "Laboratory"
WHERE "Laboratory"."id" = "UserRegistrationInvitation"."laboratoryId";

ALTER TABLE "UserRegistrationInvitation" ALTER COLUMN "serviceId" SET NOT NULL;

CREATE INDEX "UserRegistrationInvitation_serviceId_status_idx" ON "UserRegistrationInvitation"("serviceId", "status");

ALTER TABLE "UserRegistrationInvitation" ADD CONSTRAINT "UserRegistrationInvitation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "UserRegistrationInvitation_laboratoryId_status_idx";

ALTER TABLE "UserRegistrationInvitation" DROP CONSTRAINT "UserRegistrationInvitation_laboratoryId_fkey";

ALTER TABLE "UserRegistrationInvitation" DROP COLUMN "laboratoryId";

-- Remove laboratory-specific authorization tables after migrating their data.
DROP TABLE "UserLaboratoryMembershipRole";
DROP TABLE "LaboratoryRole";
DROP TABLE "UserLaboratoryMembership";

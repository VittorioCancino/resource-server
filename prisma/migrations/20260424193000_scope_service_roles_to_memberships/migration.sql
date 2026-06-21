-- Attach service role assignments to the user-service membership, mirroring lab memberships.
CREATE TABLE "UserServiceMembership" (
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "UserServiceMembership_pkey" PRIMARY KEY ("userId", "serviceId")
);

CREATE TABLE "UserServiceMembershipRole" (
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceRoleId" TEXT NOT NULL,

    CONSTRAINT "UserServiceMembershipRole_pkey" PRIMARY KEY ("userId", "serviceId", "serviceRoleId")
);

-- Needed for the composite FK that guarantees assigned roles belong to the same service as the membership.
CREATE UNIQUE INDEX "ServiceRole_id_serviceId_key" ON "ServiceRole"("id", "serviceId");

-- Preserve existing direct user-role assignments by creating memberships first.
INSERT INTO "UserServiceMembership" ("userId", "serviceId")
SELECT "UserServiceRole"."userId", "ServiceRole"."serviceId"
FROM "UserServiceRole"
INNER JOIN "ServiceRole" ON "ServiceRole"."id" = "UserServiceRole"."serviceRoleId"
ON CONFLICT DO NOTHING;

-- Move existing assignments under the corresponding membership.
INSERT INTO "UserServiceMembershipRole" ("userId", "serviceId", "serviceRoleId")
SELECT "UserServiceRole"."userId", "ServiceRole"."serviceId", "UserServiceRole"."serviceRoleId"
FROM "UserServiceRole"
INNER JOIN "ServiceRole" ON "ServiceRole"."id" = "UserServiceRole"."serviceRoleId"
ON CONFLICT DO NOTHING;

ALTER TABLE "UserServiceMembership" ADD CONSTRAINT "UserServiceMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserServiceMembership" ADD CONSTRAINT "UserServiceMembership_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserServiceMembershipRole" ADD CONSTRAINT "UserServiceMembershipRole_userId_serviceId_fkey" FOREIGN KEY ("userId", "serviceId") REFERENCES "UserServiceMembership"("userId", "serviceId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserServiceMembershipRole" ADD CONSTRAINT "UserServiceMembershipRole_serviceRoleId_serviceId_fkey" FOREIGN KEY ("serviceRoleId", "serviceId") REFERENCES "ServiceRole"("id", "serviceId") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "UserServiceRole";

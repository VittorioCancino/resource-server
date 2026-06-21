-- Attach laboratory role assignments to the user-laboratory membership instead of directly to the user.
CREATE TABLE "UserLaboratoryMembershipRole" (
    "userId" TEXT NOT NULL,
    "laboratoryId" TEXT NOT NULL,
    "laboratoryRoleId" TEXT NOT NULL,

    CONSTRAINT "UserLaboratoryMembershipRole_pkey" PRIMARY KEY ("userId", "laboratoryId", "laboratoryRoleId")
);

-- Needed for the composite FK that guarantees assigned roles belong to the same lab as the membership.
CREATE UNIQUE INDEX "LaboratoryRole_id_laboratoryId_key" ON "LaboratoryRole"("id", "laboratoryId");

-- Preserve existing direct user-role assignments by creating memberships first.
INSERT INTO "UserLaboratoryMembership" ("userId", "laboratoryId")
SELECT "UserLaboratoryRole"."userId", "LaboratoryRole"."laboratoryId"
FROM "UserLaboratoryRole"
INNER JOIN "LaboratoryRole" ON "LaboratoryRole"."id" = "UserLaboratoryRole"."laboratoryRoleId"
ON CONFLICT DO NOTHING;

-- Move existing assignments under the corresponding membership.
INSERT INTO "UserLaboratoryMembershipRole" ("userId", "laboratoryId", "laboratoryRoleId")
SELECT "UserLaboratoryRole"."userId", "LaboratoryRole"."laboratoryId", "UserLaboratoryRole"."laboratoryRoleId"
FROM "UserLaboratoryRole"
INNER JOIN "LaboratoryRole" ON "LaboratoryRole"."id" = "UserLaboratoryRole"."laboratoryRoleId"
ON CONFLICT DO NOTHING;

ALTER TABLE "UserLaboratoryMembershipRole" ADD CONSTRAINT "UserLaboratoryMembershipRole_membership_fkey" FOREIGN KEY ("userId", "laboratoryId") REFERENCES "UserLaboratoryMembership"("userId", "laboratoryId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserLaboratoryMembershipRole" ADD CONSTRAINT "UserLaboratoryMembershipRole_laboratoryRole_fkey" FOREIGN KEY ("laboratoryRoleId", "laboratoryId") REFERENCES "LaboratoryRole"("id", "laboratoryId") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "UserLaboratoryRole";

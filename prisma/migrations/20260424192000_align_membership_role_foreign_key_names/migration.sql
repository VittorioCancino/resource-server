-- Align manually created FK names with Prisma's expected convention.
ALTER TABLE "UserLaboratoryMembershipRole" RENAME CONSTRAINT "UserLaboratoryMembershipRole_laboratoryRole_fkey" TO "UserLaboratoryMembershipRole_laboratoryRoleId_laboratoryId_fkey";

ALTER TABLE "UserLaboratoryMembershipRole" RENAME CONSTRAINT "UserLaboratoryMembershipRole_membership_fkey" TO "UserLaboratoryMembershipRole_userId_laboratoryId_fkey";

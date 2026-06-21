-- Roles are a temporary placeholder until the platform access model is designed.
-- Users can exist without a role.
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

ALTER TABLE "User" ALTER COLUMN "roleId" DROP NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

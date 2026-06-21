-- Move from a single optional user role to a many-to-many user-role relation.
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId")
);

-- Preserve any existing single-role assignments.
INSERT INTO "UserRole" ("userId", "roleId")
SELECT "id", "roleId" FROM "User" WHERE "roleId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Remove the old direct role relation.
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";
ALTER TABLE "User" DROP COLUMN "roleId";

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

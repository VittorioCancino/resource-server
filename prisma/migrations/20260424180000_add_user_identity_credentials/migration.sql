-- Add stable subject identifier used as Hydra/OIDC `sub`
ALTER TABLE "User" ADD COLUMN "subject" TEXT;

-- Existing rows use their current internal id as the initial subject.
UPDATE "User" SET "subject" = "id" WHERE "subject" IS NULL;

ALTER TABLE "User" ALTER COLUMN "subject" SET NOT NULL;

-- CreateTable
CREATE TABLE "UserCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "UserCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_subject_key" ON "User"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredential_userId_key" ON "UserCredential"("userId");

-- AddForeignKey
ALTER TABLE "UserCredential" ADD CONSTRAINT "UserCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

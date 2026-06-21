-- Remove the temporary generic user-role model.
DROP TABLE IF EXISTS "UserRole";
DROP TABLE IF EXISTS "Role";

-- Laboratory-scoped roles.
CREATE TABLE "LaboratoryRole" (
    "id" TEXT NOT NULL,
    "laboratoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "LaboratoryRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserLaboratoryRole" (
    "userId" TEXT NOT NULL,
    "laboratoryRoleId" TEXT NOT NULL,

    CONSTRAINT "UserLaboratoryRole_pkey" PRIMARY KEY ("userId", "laboratoryRoleId")
);

CREATE UNIQUE INDEX "LaboratoryRole_laboratoryId_name_key" ON "LaboratoryRole"("laboratoryId", "name");

ALTER TABLE "LaboratoryRole" ADD CONSTRAINT "LaboratoryRole_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserLaboratoryRole" ADD CONSTRAINT "UserLaboratoryRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserLaboratoryRole" ADD CONSTRAINT "UserLaboratoryRole_laboratoryRoleId_fkey" FOREIGN KEY ("laboratoryRoleId") REFERENCES "LaboratoryRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Platform service registry and service-scoped roles.
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceRole" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ServiceRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserServiceRole" (
    "userId" TEXT NOT NULL,
    "serviceRoleId" TEXT NOT NULL,

    CONSTRAINT "UserServiceRole_pkey" PRIMARY KEY ("userId", "serviceRoleId")
);

CREATE UNIQUE INDEX "Service_key_key" ON "Service"("key");

CREATE UNIQUE INDEX "ServiceRole_serviceId_name_key" ON "ServiceRole"("serviceId", "name");

ALTER TABLE "ServiceRole" ADD CONSTRAINT "ServiceRole_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserServiceRole" ADD CONSTRAINT "UserServiceRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserServiceRole" ADD CONSTRAINT "UserServiceRole_serviceRoleId_fkey" FOREIGN KEY ("serviceRoleId") REFERENCES "ServiceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

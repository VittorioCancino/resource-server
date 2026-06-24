-- Service.clientId is the public OAuth/client identifier for services.
-- Remove the duplicate Service.key column.
DROP INDEX IF EXISTS "Service_key_key";
ALTER TABLE "Service" DROP COLUMN "key";

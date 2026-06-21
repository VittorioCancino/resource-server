-- Keep existing subjects aligned with the default resource-server subject policy.
-- The subject is the lowercase local part of the institutional email address.
UPDATE "User" SET "subject" = lower(split_part("email", '@', 1));

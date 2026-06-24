-- Allow managers to reject a claimed registration code. Rejection keeps the
-- code row for status/history but deletes the pending user in application code.
ALTER TYPE "UserRegistrationInvitationStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Allow administrators to disable users without deleting their profile or history.
ALTER TYPE "UserStatus" ADD VALUE 'DISABLED';

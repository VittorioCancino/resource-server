export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function subjectFromEmail(email: string): string {
  return normalizeEmail(email).split('@')[0];
}

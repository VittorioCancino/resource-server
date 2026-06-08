const REDACTED_VALUE = '[REDACTED]';
const MAX_DEPTH = 6;
const MAX_STRING_LENGTH = 2000;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_KEYS = 100;

const SENSITIVE_KEY_PARTS = [
  'authorization',
  'cookie',
  'password',
  'passwd',
  'secret',
  'token',
  'credential',
  'apikey',
  'api_key',
  'clientsecret',
  'client_secret',
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_\s]/g, '');
}

function isSensitiveKey(key: string): boolean {
  const normalizedKey = normalizeKey(key);

  return SENSITIVE_KEY_PARTS.some((sensitiveKey) =>
    normalizedKey.includes(normalizeKey(sensitiveKey)),
  );
}

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED]`;
}

export function redactValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (depth >= MAX_DEPTH) {
    return '[MAX_DEPTH]';
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => redactValue(item, depth + 1));
  }

  if (typeof value === 'symbol') {
    return value.description ?? '[SYMBOL]';
  }

  if (typeof value === 'function') {
    return '[FUNCTION]';
  }

  const redactedObject: Record<string, unknown> = {};
  const entries = Object.entries(value as Record<string, unknown>).slice(
    0,
    MAX_OBJECT_KEYS,
  );

  for (const [key, nestedValue] of entries) {
    redactedObject[key] = isSensitiveKey(key)
      ? REDACTED_VALUE
      : redactValue(nestedValue, depth + 1);
  }

  return redactedObject;
}

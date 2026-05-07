/**
 * Converts a camelCase key to snake_case
 */
function keyToSnake(key: string): string {
  return key.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Recursively converts all keys of an object (or array of objects) from camelCase to snake_case.
 * Prisma returns camelCase; Flutter models expect snake_case.
 */
function toSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [keyToSnake(k), toSnake(v)])
    );
  }
  return obj;
}

export default toSnake;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Converts a camelCase key to snake_case
 */
function keyToSnake(key) {
    return key.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
}
/**
 * Recursively converts all keys of an object (or array of objects) from camelCase to snake_case.
 * Prisma returns camelCase; Flutter models expect snake_case.
 */
function toSnake(obj) {
    if (Array.isArray(obj))
        return obj.map(toSnake);
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [keyToSnake(k), toSnake(v)]));
    }
    return obj;
}
exports.default = toSnake;
//# sourceMappingURL=toSnake.js.map
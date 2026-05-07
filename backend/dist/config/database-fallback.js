"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const logger_1 = __importDefault(require("../utils/logger"));
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'cricket_match_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
});
pool.on('connect', () => {
    logger_1.default.info('PostgreSQL connected successfully (using pg Pool)');
});
pool.on('error', (err) => {
    logger_1.default.error('PostgreSQL connection error: ' + err.message);
});
exports.default = pool;
//# sourceMappingURL=database-fallback.js.map
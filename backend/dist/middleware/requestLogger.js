"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const requestLogger = (req, _res, next) => {
    if (req.method !== 'GET') {
        const body = { ...req.body };
        if (body.password)
            body.password = '***';
        if (body.token)
            body.token = '***';
        logger_1.default.info(`${req.method} ${req.url}`);
        if (Object.keys(body).length > 0) {
            logger_1.default.debug(`   Body: ${JSON.stringify(body).substring(0, 200)}`);
        }
    }
    next();
};
exports.default = requestLogger;
//# sourceMappingURL=requestLogger.js.map
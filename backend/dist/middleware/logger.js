"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = __importDefault(require("../utils/logger"));
morgan_1.default.token('body', (req) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        const body = { ...req.body };
        if (body.password)
            body.password = '***';
        return JSON.stringify(body).substring(0, 200);
    }
    return '';
});
const stream = {
    write: (message) => logger_1.default.http(message.trim()),
};
const skip = () => {
    const env = process.env.NODE_ENV || 'development';
    return env !== 'development';
};
const detailedFormat = ':method :url :status :response-time ms - :res[content-length] bytes';
const morganMiddleware = (0, morgan_1.default)(detailedFormat, { stream, skip });
exports.default = morganMiddleware;
//# sourceMappingURL=logger.js.map
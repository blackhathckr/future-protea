"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
winston_1.default.addColors(logColors);
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => {
    const timestamp = info.timestamp;
    const level = info.level.toUpperCase().padEnd(15);
    return `[${timestamp}] ${level} ${info.message}`;
}));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.uncolorize(), winston_1.default.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`));
const transports = [
    new winston_1.default.transports.Console({
        format: consoleFormat,
        handleExceptions: true,
    }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(__dirname, '../../logs/error.log'),
        level: 'error',
        format: fileFormat,
        handleExceptions: true,
    }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(__dirname, '../../logs/combined.log'),
        format: fileFormat,
        handleExceptions: true,
    }),
];
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: logLevels,
    transports,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map
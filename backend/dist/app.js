"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const requestLogger_1 = __importDefault(require("./middleware/requestLogger"));
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(requestLogger_1.default);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use(routes_1.default);
app.get('/health', (_req, res) => {
    logger_1.default.info('Health check requested');
    res.json({ status: 'ok', message: 'Server is running' });
});
app.use((err, req, res, _next) => {
    logger_1.default.error(`ERROR: ${err.message}`);
    logger_1.default.error(`   Route: ${req.method} ${req.url}`);
    logger_1.default.error(`   Stack: ${err.stack}`);
    res.status(500).json({ error: 'Something went wrong!' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    logger_1.default.info('Cricket Match Management API Server Started');
    console.log('='.repeat(60));
    logger_1.default.info(`Port: ${PORT}`);
    logger_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.default.info(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
    logger_1.default.info(`Health Check: http://localhost:${PORT}/health`);
    logger_1.default.info(`Logs Directory: ./logs/`);
    console.log('='.repeat(60) + '\n');
    logger_1.default.info('Server ready to accept requests...\n');
});
exports.default = app;
//# sourceMappingURL=app.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const matchRoutes_1 = __importDefault(require("./matchRoutes"));
const playerRoutes_1 = __importDefault(require("./playerRoutes"));
const teamRoutes_1 = __importDefault(require("./teamRoutes"));
const tournamentRoutes_1 = __importDefault(require("./tournamentRoutes"));
const router = (0, express_1.Router)();
router.use('/api', authRoutes_1.default);
router.use('/api', matchRoutes_1.default);
router.use('/api', playerRoutes_1.default);
router.use('/api', teamRoutes_1.default);
router.use('/api', tournamentRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map
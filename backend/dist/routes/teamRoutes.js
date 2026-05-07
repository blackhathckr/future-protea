"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teamController_1 = __importDefault(require("../controllers/teamController"));
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
router.get('/teams', auth_1.authenticate, teamController_1.default.getTeams);
router.get('/teams/:id', auth_1.authenticate, teamController_1.default.getTeamById);
router.post('/teams', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), teamController_1.default.createTeam);
router.put('/teams/:id', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), teamController_1.default.updateTeam);
router.post('/teams/:id/logo', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), upload_1.default.single('logo'), teamController_1.default.uploadTeamLogo);
router.delete('/teams/:id/logo', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), teamController_1.default.deleteTeamLogo);
router.post('/teams/:id/players', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), teamController_1.default.addPlayerToTeam);
router.put('/teams/:teamId/players/:playerId/role', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), teamController_1.default.updatePlayerRole);
router.delete('/teams/:teamId/players/:playerId', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), teamController_1.default.removePlayerFromTeam);
exports.default = router;
//# sourceMappingURL=teamRoutes.js.map
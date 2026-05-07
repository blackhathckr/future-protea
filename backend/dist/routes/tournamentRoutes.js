"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tournamentController_1 = __importDefault(require("../controllers/tournamentController"));
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
router.get('/tournaments', auth_1.authenticate, tournamentController_1.default.getTournaments);
router.get('/tournaments/:id', auth_1.authenticate, tournamentController_1.default.getTournamentById);
router.post('/tournaments', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), tournamentController_1.default.createTournament);
router.post('/tournaments/:id/teams', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), tournamentController_1.default.addTeamToTournament);
router.get('/tournaments/:id/fixtures', auth_1.authenticate, tournamentController_1.default.getTournamentFixtures);
router.get('/tournaments/:id/standings', auth_1.authenticate, tournamentController_1.default.getTournamentStandings);
router.get('/tournaments/:id/stats', auth_1.authenticate, tournamentController_1.default.getTournamentStats);
router.put('/tournaments/:id', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), tournamentController_1.default.updateTournament);
router.post('/tournaments/:id/logo', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), upload_1.default.single('logo'), tournamentController_1.default.uploadTournamentLogo);
exports.default = router;
//# sourceMappingURL=tournamentRoutes.js.map
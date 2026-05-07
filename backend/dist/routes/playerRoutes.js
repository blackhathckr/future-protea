"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playerController_1 = __importDefault(require("../controllers/playerController"));
const registeredPlayerController_1 = __importDefault(require("../controllers/registeredPlayerController"));
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
router.get('/players/me/profile', auth_1.authenticate, playerController_1.default.getMyProfile);
router.get('/players/all', auth_1.authenticate, playerController_1.default.getAllPlayers);
router.get('/players/journey-by-name', auth_1.authenticate, playerController_1.default.getPlayerJourneyByName);
router.get('/players', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), playerController_1.default.getPlayers);
router.put('/players/:id/approve', auth_1.authenticate, (0, auth_1.authorize)(['feeder']), playerController_1.default.approvePlayer);
router.get('/players/:id/journey', auth_1.authenticate, playerController_1.default.getPlayerJourney);
router.get('/registered-players', auth_1.authenticate, registeredPlayerController_1.default.getRegisteredPlayers);
router.post('/registered-players', auth_1.authenticate, (0, auth_1.authorize)(['feeder', 'player']), registeredPlayerController_1.default.createRegisteredPlayer);
router.post('/registered-players/:id/photo', auth_1.authenticate, (0, auth_1.authorize)(['feeder', 'player']), upload_1.default.single('photo'), registeredPlayerController_1.default.uploadPlayerPhoto);
router.put('/registered-players/:id', auth_1.authenticate, (0, auth_1.authorize)(['feeder', 'player']), registeredPlayerController_1.default.updateRegisteredPlayer);
router.delete('/registered-players/:id/photo', auth_1.authenticate, (0, auth_1.authorize)(['feeder', 'player']), registeredPlayerController_1.default.deletePlayerPhoto);
router.delete('/registered-players/:id', auth_1.authenticate, (0, auth_1.authorize)(['feeder', 'player']), registeredPlayerController_1.default.deletePlayer);
exports.default = router;
//# sourceMappingURL=playerRoutes.js.map
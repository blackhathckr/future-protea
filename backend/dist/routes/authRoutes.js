"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
router.post('/register', authController_1.default.register);
router.post('/login', authController_1.default.login);
router.get('/me', auth_1.authenticate, authController_1.default.getMe);
router.put('/profile', auth_1.authenticate, authController_1.default.updateProfile);
router.post('/profile/photo', auth_1.authenticate, upload_1.default.single('photo'), authController_1.default.uploadProfilePhoto);
router.delete('/profile/photo', auth_1.authenticate, authController_1.default.deleteProfilePhoto);
router.post('/change-password', auth_1.authenticate, authController_1.default.changePassword);
router.post('/forgot-password', authController_1.default.forgotPassword);
router.post('/reset-password', authController_1.default.resetPassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map
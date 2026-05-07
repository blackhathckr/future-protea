"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const toSnake_1 = __importDefault(require("../utils/toSnake"));
const supabaseStorage_1 = __importDefault(require("../services/supabaseStorage"));
const USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    phone: true,
    photoUrl: true,
    dateOfBirth: true,
    battingStyle: true,
    bowlingStyle: true,
    approved: true,
    createdAt: true,
    lastLogin: true,
};
const register = async (req, res) => {
    const { name, email, password, role, phone, batting_style, bowling_style } = req.body;
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await database_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                phone: phone || null,
                battingStyle: batting_style || null,
                bowlingStyle: bowling_style || null,
                approved: role !== 'player',
            },
            select: USER_SELECT,
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET);
        res.status(201).json({ token, user: (0, toSnake_1.default)(user) });
    }
    catch (error) {
        const err = error;
        if (err.code === 'P2002') {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }
        res.status(500).json({ error: err.message });
    }
};
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await database_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ error: 'User not found' });
            return;
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            res.status(400).json({ error: 'Invalid password' });
            return;
        }
        user = await database_1.default.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET);
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                photo_url: user.photoUrl,
                date_of_birth: user.dateOfBirth,
                batting_style: user.battingStyle,
                bowling_style: user.bowlingStyle,
                approved: user.approved,
                created_at: user.createdAt,
                last_login: user.lastLogin,
            },
        });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const getMe = async (req, res) => {
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.id },
            select: USER_SELECT,
        });
        res.json((0, toSnake_1.default)(user));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const updateProfile = async (req, res) => {
    const { name, phone, date_of_birth, batting_style, bowling_style } = req.body;
    try {
        const data = {};
        if (name)
            data.name = name;
        if (phone !== undefined)
            data.phone = phone || null;
        if (date_of_birth !== undefined)
            data.dateOfBirth = date_of_birth ? new Date(date_of_birth) : null;
        if (batting_style !== undefined)
            data.battingStyle = batting_style || null;
        if (bowling_style !== undefined)
            data.bowlingStyle = bowling_style || null;
        const user = await database_1.default.user.update({
            where: { id: req.user.id },
            data,
            select: USER_SELECT,
        });
        res.json((0, toSnake_1.default)(user));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const fileName = `user_${req.user.id}_${Date.now()}`;
        const photoUrl = await supabaseStorage_1.default.uploadFile(req.file, fileName);
        const user = await database_1.default.user.update({
            where: { id: req.user.id },
            data: { photoUrl },
            select: USER_SELECT,
        });
        res.json((0, toSnake_1.default)(user));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const deleteProfilePhoto = async (req, res) => {
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { photoUrl: true },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (user.photoUrl && user.photoUrl.includes('supabase') && supabaseStorage_1.default.isConfigured()) {
            try {
                await supabaseStorage_1.default.deleteFile(user.photoUrl);
            }
            catch (err) {
                console.warn('Failed to delete photo from storage:', err.message);
            }
        }
        const updatedUser = await database_1.default.user.update({
            where: { id: req.user.id },
            data: { photoUrl: null },
            select: USER_SELECT,
        });
        res.json((0, toSnake_1.default)(updatedUser));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const changePassword = async (req, res) => {
    const { current_password, new_password } = req.body;
    try {
        if (!current_password || !new_password) {
            res.status(400).json({ error: 'Current password and new password are required' });
            return;
        }
        const user = await database_1.default.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const validPassword = await bcryptjs_1.default.compare(current_password, user.password);
        if (!validPassword) {
            res.status(400).json({ error: 'Current password is incorrect' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(new_password, 10);
        await database_1.default.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword },
        });
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        const user = await database_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // Return success even if user not found (security: don't reveal if email exists)
            res.json({ message: 'If this email is registered, an OTP has been sent' });
            return;
        }
        // TODO: In production, send real OTP via email service
        // For now, OTP is hardcoded as 123456
        res.json({ message: 'If this email is registered, an OTP has been sent' });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const resetPassword = async (req, res) => {
    const { email, otp, new_password } = req.body;
    try {
        if (!email || !otp || !new_password) {
            res.status(400).json({ error: 'Email, OTP, and new password are required' });
            return;
        }
        if (new_password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }
        // TODO: In production, validate OTP from cache/DB
        // For now, accept hardcoded OTP 123456
        if (otp !== '123456') {
            res.status(400).json({ error: 'Invalid OTP' });
            return;
        }
        const user = await database_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ error: 'User not found' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(new_password, 10);
        await database_1.default.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
exports.default = { register, login, getMe, updateProfile, uploadProfilePhoto, deleteProfilePhoto, changePassword, forgotPassword, resetPassword };
//# sourceMappingURL=authController.js.map
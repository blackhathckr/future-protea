"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const supabase_1 = __importDefault(require("../config/supabase"));
const toSnake_1 = __importDefault(require("../utils/toSnake"));
const getRegisteredPlayers = async (req, res) => {
    const { search } = req.query;
    try {
        const players = await database_1.default.registeredPlayer.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { playerIdCode: { contains: search, mode: 'insensitive' } },
                    { schoolName: { contains: search, mode: 'insensitive' } },
                    { clubName: { contains: search, mode: 'insensitive' } },
                ],
            } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        res.json((0, toSnake_1.default)(players));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const createRegisteredPlayer = async (req, res) => {
    const { name, date_of_birth, email, phone, emergency_contact, emergency_contact_name, address, city, state, country, postal_code, height, weight, blood_group, school_name, club_name, batting_style, bowling_style, playing_role, jersey_number, father_name, mother_name, guardian_name, nationality, } = req.body;
    try {
        const count = await database_1.default.registeredPlayer.count();
        const playerIdCode = `GUCT-${String(count + 1).padStart(4, '0')}`;
        const player = await database_1.default.registeredPlayer.create({
            data: {
                name,
                playerIdCode,
                dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
                email: email || null,
                phone: phone || null,
                emergencyContact: emergency_contact || null,
                emergencyContactName: emergency_contact_name || null,
                address: address || null,
                city: city || null,
                state: state || null,
                country: country || null,
                postalCode: postal_code || null,
                height: height ? parseFloat(height) : null,
                weight: weight ? parseFloat(weight) : null,
                bloodGroup: blood_group || null,
                schoolName: school_name || null,
                clubName: club_name || null,
                battingStyle: batting_style || null,
                bowlingStyle: bowling_style || null,
                playingRole: playing_role || null,
                jerseyNumber: jersey_number ? parseInt(jersey_number) : null,
                fatherName: father_name || null,
                motherName: mother_name || null,
                guardianName: guardian_name || null,
                nationality: nationality || null,
                createdBy: req.user.id,
            },
        });
        res.status(201).json((0, toSnake_1.default)(player));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const uploadPlayerPhoto = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const currentPlayer = await database_1.default.registeredPlayer.findUnique({
            where: { id: parseInt(req.params.id) },
            select: { photoUrl: true },
        });
        if (!currentPlayer) {
            res.status(404).json({ error: 'Player not found' });
            return;
        }
        const oldPhotoUrl = currentPlayer.photoUrl;
        if (oldPhotoUrl && oldPhotoUrl.includes('supabase') && supabase_1.default.isConfigured()) {
            try {
                await supabase_1.default.deleteFile(oldPhotoUrl);
            }
            catch (err) {
                console.warn('Failed to delete old photo:', err.message);
            }
        }
        const photoUrl = await supabase_1.default.uploadFile(req.file, `player_${req.params.id}_${Date.now()}`);
        const player = await database_1.default.registeredPlayer.update({
            where: { id: parseInt(req.params.id) },
            data: { photoUrl },
        });
        res.json((0, toSnake_1.default)(player));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const updateRegisteredPlayer = async (req, res) => {
    const { name, date_of_birth, email, phone, emergency_contact, emergency_contact_name, address, city, state, country, postal_code, height, weight, blood_group, school_name, club_name, batting_style, bowling_style, playing_role, jersey_number, father_name, mother_name, guardian_name, nationality, } = req.body;
    try {
        const data = {};
        if (name)
            data.name = name;
        if (date_of_birth)
            data.dateOfBirth = new Date(date_of_birth);
        if (email !== undefined)
            data.email = email;
        if (phone !== undefined)
            data.phone = phone;
        if (emergency_contact !== undefined)
            data.emergencyContact = emergency_contact;
        if (emergency_contact_name !== undefined)
            data.emergencyContactName = emergency_contact_name;
        if (address !== undefined)
            data.address = address;
        if (city !== undefined)
            data.city = city;
        if (state !== undefined)
            data.state = state;
        if (country !== undefined)
            data.country = country;
        if (postal_code !== undefined)
            data.postalCode = postal_code;
        if (height !== undefined)
            data.height = height ? parseFloat(height) : null;
        if (weight !== undefined)
            data.weight = weight ? parseFloat(weight) : null;
        if (blood_group !== undefined)
            data.bloodGroup = blood_group;
        if (school_name !== undefined)
            data.schoolName = school_name;
        if (club_name !== undefined)
            data.clubName = club_name;
        if (batting_style !== undefined)
            data.battingStyle = batting_style;
        if (bowling_style !== undefined)
            data.bowlingStyle = bowling_style;
        if (playing_role !== undefined)
            data.playingRole = playing_role;
        if (jersey_number !== undefined)
            data.jerseyNumber = jersey_number ? parseInt(jersey_number) : null;
        if (father_name !== undefined)
            data.fatherName = father_name;
        if (mother_name !== undefined)
            data.motherName = mother_name;
        if (guardian_name !== undefined)
            data.guardianName = guardian_name;
        if (nationality !== undefined)
            data.nationality = nationality;
        const player = await database_1.default.registeredPlayer.update({
            where: { id: parseInt(req.params.id) },
            data,
        });
        res.json((0, toSnake_1.default)(player));
    }
    catch (error) {
        const err = error;
        if (err.code === 'P2025') {
            res.status(404).json({ error: 'Player not found' });
            return;
        }
        res.status(500).json({ error: err.message });
    }
};
const deletePlayerPhoto = async (req, res) => {
    try {
        const playerId = parseInt(req.params.id);
        const player = await database_1.default.registeredPlayer.findUnique({
            where: { id: playerId },
            select: { photoUrl: true },
        });
        if (!player) {
            res.status(404).json({ error: 'Player not found' });
            return;
        }
        if (player.photoUrl && player.photoUrl.includes('supabase') && supabase_1.default.isConfigured()) {
            try {
                await supabase_1.default.deleteFile(player.photoUrl);
            }
            catch (err) {
                console.warn('Failed to delete photo from storage:', err.message);
            }
        }
        const updatedPlayer = await database_1.default.registeredPlayer.update({
            where: { id: playerId },
            data: { photoUrl: null },
        });
        res.json((0, toSnake_1.default)(updatedPlayer));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const deletePlayer = async (req, res) => {
    try {
        const playerId = parseInt(req.params.id);
        const player = await database_1.default.registeredPlayer.findUnique({
            where: { id: playerId },
            select: { photoUrl: true },
        });
        if (!player) {
            res.status(404).json({ error: 'Player not found' });
            return;
        }
        if (player.photoUrl && player.photoUrl.includes('supabase') && supabase_1.default.isConfigured()) {
            try {
                await supabase_1.default.deleteFile(player.photoUrl);
            }
            catch (err) {
                console.warn('Failed to delete photo from storage:', err.message);
            }
        }
        await database_1.default.registeredPlayer.delete({
            where: { id: playerId },
        });
        res.json({ message: 'Player deleted successfully' });
    }
    catch (error) {
        const err = error;
        if (err.code === 'P2025') {
            res.status(404).json({ error: 'Player not found' });
            return;
        }
        res.status(500).json({ error: err.message });
    }
};
exports.default = {
    getRegisteredPlayers,
    createRegisteredPlayer,
    uploadPlayerPhoto,
    updateRegisteredPlayer,
    deletePlayerPhoto,
    deletePlayer,
};
//# sourceMappingURL=registeredPlayerController.js.map
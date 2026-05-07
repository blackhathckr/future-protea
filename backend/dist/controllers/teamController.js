"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const toSnake_1 = __importDefault(require("../utils/toSnake"));
const supabaseStorage_1 = __importDefault(require("../services/supabaseStorage"));
const getTeams = async (_req, res) => {
    try {
        const teams = await database_1.default.team.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json((0, toSnake_1.default)(teams));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const getTeamById = async (req, res) => {
    try {
        const team = await database_1.default.team.findUnique({
            where: { id: parseInt(req.params.id) },
        });
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        const players = await database_1.default.teamPlayer.findMany({
            where: { teamId: parseInt(req.params.id) },
            include: {
                player: {
                    select: {
                        id: true,
                        name: true,
                        dateOfBirth: true,
                        photoUrl: true,
                        playerIdCode: true,
                    },
                },
            },
            orderBy: { player: { name: 'asc' } },
        });
        res.json((0, toSnake_1.default)({
            ...team,
            players: players.map((tp) => ({
                id: tp.id,
                team_id: tp.teamId,
                player_id: tp.playerId,
                player_name: tp.player.name,
                date_of_birth: tp.player.dateOfBirth,
                photo_url: tp.player.photoUrl,
                player_id_code: tp.player.playerIdCode,
                is_captain: tp.isCaptain,
                is_wicket_keeper: tp.isWicketKeeper,
            })),
        }));
    }
    catch (error) {
        const err = error;
        res.status(500).json((0, toSnake_1.default)({ error: err.message }));
    }
};
const createTeam = async (req, res) => {
    const { team_name, team_type, school_name, club_name } = req.body;
    try {
        const team = await database_1.default.team.create({
            data: {
                teamName: team_name,
                teamType: team_type,
                schoolName: school_name || null,
                clubName: club_name || null,
                createdBy: req.user.id,
            },
        });
        res.status(201).json((0, toSnake_1.default)(team));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const addPlayerToTeam = async (req, res) => {
    const { player_id } = req.body;
    try {
        await database_1.default.teamPlayer.create({
            data: {
                teamId: parseInt(req.params.id),
                playerId: player_id,
            },
        });
        res.status(201).json({ message: 'Player added to team' });
    }
    catch (error) {
        const err = error;
        if (err.code === 'P2002') {
            res.status(400).json({ error: 'Player already in team' });
            return;
        }
        res.status(500).json({ error: err.message });
    }
};
const removePlayerFromTeam = async (req, res) => {
    try {
        await database_1.default.teamPlayer.deleteMany({
            where: {
                teamId: parseInt(req.params.teamId),
                playerId: parseInt(req.params.playerId),
            },
        });
        res.json({ message: 'Player removed from team' });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const updateTeam = async (req, res) => {
    const { team_name, team_type, school_name, club_name } = req.body;
    try {
        const data = {};
        if (team_name)
            data.teamName = team_name;
        if (team_type)
            data.teamType = team_type;
        if (school_name !== undefined)
            data.schoolName = school_name || null;
        if (club_name !== undefined)
            data.clubName = club_name || null;
        if (Object.keys(data).length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }
        const team = await database_1.default.team.update({
            where: { id: parseInt(req.params.id) },
            data,
        });
        res.json((0, toSnake_1.default)(team));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const updatePlayerRole = async (req, res) => {
    const { is_captain, is_wicket_keeper } = req.body;
    try {
        const teamId = parseInt(req.params.teamId);
        const playerId = parseInt(req.params.playerId);
        if (is_captain === true) {
            await database_1.default.teamPlayer.updateMany({
                where: { teamId, isCaptain: true },
                data: { isCaptain: false },
            });
        }
        if (is_wicket_keeper === true) {
            await database_1.default.teamPlayer.updateMany({
                where: { teamId, isWicketKeeper: true },
                data: { isWicketKeeper: false },
            });
        }
        const data = {};
        if (is_captain !== undefined)
            data.isCaptain = is_captain;
        if (is_wicket_keeper !== undefined)
            data.isWicketKeeper = is_wicket_keeper;
        await database_1.default.teamPlayer.updateMany({
            where: { teamId, playerId },
            data,
        });
        res.json({ message: 'Player role updated successfully' });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const uploadTeamLogo = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const teamId = parseInt(req.params.id);
        const team = await database_1.default.team.findUnique({ where: { id: teamId } });
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        if (team.logoUrl) {
            await supabaseStorage_1.default.deleteFile(team.logoUrl);
        }
        const fileName = `team_${teamId}_${Date.now()}`;
        const logoUrl = await supabaseStorage_1.default.uploadFile(req.file, fileName);
        const updatedTeam = await database_1.default.team.update({
            where: { id: teamId },
            data: { logoUrl },
        });
        res.json((0, toSnake_1.default)(updatedTeam));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const deleteTeamLogo = async (req, res) => {
    try {
        const teamId = parseInt(req.params.id);
        const team = await database_1.default.team.findUnique({
            where: { id: teamId },
            select: { logoUrl: true },
        });
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        if (team.logoUrl && team.logoUrl.includes('supabase') && supabaseStorage_1.default.isConfigured()) {
            try {
                await supabaseStorage_1.default.deleteFile(team.logoUrl);
            }
            catch (err) {
                console.warn('Failed to delete logo from storage:', err.message);
            }
        }
        const updatedTeam = await database_1.default.team.update({
            where: { id: teamId },
            data: { logoUrl: null },
        });
        res.json((0, toSnake_1.default)(updatedTeam));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
exports.default = {
    getTeams,
    getTeamById,
    createTeam,
    addPlayerToTeam,
    removePlayerFromTeam,
    updateTeam,
    updatePlayerRole,
    uploadTeamLogo,
    deleteTeamLogo,
};
//# sourceMappingURL=teamController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const toSnake_1 = __importDefault(require("../utils/toSnake"));
const joinMatch = async (req, res) => {
    const { team } = req.body;
    try {
        const matchPlayer = await database_1.default.matchPlayer.create({
            data: {
                matchId: parseInt(req.params.id),
                playerId: req.user.id,
                team: team || null,
            },
        });
        res.status(201).json((0, toSnake_1.default)(matchPlayer));
    }
    catch (error) {
        const err = error;
        if (err.code === 'P2002') {
            res.status(400).json({ error: 'Already joined this match' });
            return;
        }
        res.status(500).json({ error: err.message });
    }
};
const getMatchPlayers = async (req, res) => {
    try {
        const matchId = parseInt(req.params.id);
        const match = await database_1.default.match.findUnique({
            where: { id: matchId },
            select: { team1Name: true, team2Name: true },
        });
        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }
        const players = await database_1.default.matchPlayer.findMany({
            where: { matchId },
            include: {
                player: {
                    select: {
                        name: true,
                        battingStyle: true,
                        bowlingStyle: true,
                        phone: true,
                    },
                },
            },
            orderBy: [{ team: 'asc' }, { status: 'asc' }],
        });
        const teams = await database_1.default.team.findMany({
            where: {
                teamName: {
                    in: [match.team1Name, match.team2Name],
                },
            },
            select: { id: true, teamName: true },
        });
        const teamIds = teams.map((t) => t.id);
        const teamPlayers = await database_1.default.teamPlayer.findMany({
            where: {
                teamId: {
                    in: teamIds,
                },
            },
            include: {
                player: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        const playerRoleMap = new Map(teamPlayers.map((tp) => [tp.player.name.toLowerCase(), {
                isCaptain: tp.isCaptain,
                isWicketKeeper: tp.isWicketKeeper,
            }]));
        // Dedupe by name within each team. Pre-existing duplicate match_player rows
        // (created before duplicate-prevention was added) would otherwise cause the
        // same name to appear twice in the scorecard's "yet to bat" list.
        const seenPerTeam = new Map();
        const flattenedPlayers = players
            .map((mp) => {
            const roleInfo = playerRoleMap.get(mp.player?.name?.toLowerCase() || '');
            return {
                id: mp.id,
                match_id: mp.matchId,
                player_id: mp.playerId,
                team: mp.team,
                status: mp.status,
                name: mp.player?.name,
                batting_style: mp.player?.battingStyle,
                bowling_style: mp.player?.bowlingStyle,
                is_captain: roleInfo?.isCaptain ?? false,
                is_wicket_keeper: roleInfo?.isWicketKeeper ?? false,
            };
        })
            .filter((p) => {
            const teamKey = p.team ?? 0;
            const nameKey = (p.name ?? '').toLowerCase().trim();
            if (!nameKey)
                return false;
            let seen = seenPerTeam.get(teamKey);
            if (!seen) {
                seen = new Set();
                seenPerTeam.set(teamKey, seen);
            }
            if (seen.has(nameKey))
                return false;
            seen.add(nameKey);
            return true;
        });
        res.json((0, toSnake_1.default)(flattenedPlayers));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const approveMatchPlayer = async (req, res) => {
    const { status, team } = req.body;
    try {
        const data = { status: status || 'approved' };
        if (team)
            data.team = team;
        const matchPlayer = await database_1.default.matchPlayer.update({
            where: { id: parseInt(req.params.id) },
            data,
        });
        res.json((0, toSnake_1.default)(matchPlayer));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const getApprovedPlayers = async (req, res) => {
    try {
        const players = await database_1.default.matchPlayer.findMany({
            where: {
                matchId: parseInt(req.params.id),
                status: 'approved',
            },
            include: {
                player: {
                    select: {
                        name: true,
                        battingStyle: true,
                        bowlingStyle: true,
                    },
                },
            },
            orderBy: [{ team: 'asc' }],
        });
        const flattenedPlayers = players.map((mp) => ({
            id: mp.id,
            match_id: mp.matchId,
            player_id: mp.playerId,
            team: mp.team,
            status: mp.status,
            name: mp.player?.name,
            batting_style: mp.player?.battingStyle,
            bowling_style: mp.player?.bowlingStyle,
        }));
        res.json((0, toSnake_1.default)(flattenedPlayers));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const populateMatchPlayers = async (req, res) => {
    try {
        const matchId = parseInt(req.params.id);
        const match = await database_1.default.match.findUnique({
            where: { id: matchId },
        });
        if (!match) {
            res.status(404).json({ error: 'Match not found' });
            return;
        }
        const teamInclude = {
            teamPlayers: {
                include: {
                    player: {
                        select: { id: true, name: true, battingStyle: true, bowlingStyle: true },
                    },
                },
            },
        };
        const [team1, team2] = await Promise.all([
            database_1.default.team.findFirst({ where: { teamName: match.team1Name }, include: teamInclude }),
            database_1.default.team.findFirst({ where: { teamName: match.team2Name }, include: teamInclude }),
        ]);
        const createdPlayers = [];
        // Collect all registered player IDs from both teams
        const allTeamPlayers = [
            ...(team1?.teamPlayers ?? []).map((tp) => ({ ...tp, teamNumber: 1 })),
            ...(team2?.teamPlayers ?? []).map((tp) => ({ ...tp, teamNumber: 2 })),
        ];
        // Pre-fetch all existing users for these temp emails in one query
        const tempEmails = allTeamPlayers.map((tp) => `player_${tp.player.id}@temp.com`);
        const existingUsers = await database_1.default.user.findMany({
            where: { email: { in: tempEmails } },
            select: { id: true, email: true, name: true },
        });
        const userByEmail = new Map(existingUsers.map((u) => [u.email, u]));
        // Pre-fetch existing match players in one query
        const existingMatchPlayers = await database_1.default.matchPlayer.findMany({
            where: { matchId },
            include: { player: { select: { name: true } } },
        });
        const seenNamesInMatch = new Set(existingMatchPlayers.map((mp) => mp.player?.name?.toLowerCase().trim() || ''));
        const existingMatchPlayerIds = new Set(existingMatchPlayers.map((mp) => mp.playerId));
        const seenNamesInTeam = new Set();
        for (const tp of allTeamPlayers) {
            const registeredPlayer = tp.player;
            const nameKey = registeredPlayer.name.toLowerCase().trim();
            const tempEmail = `player_${registeredPlayer.id}@temp.com`;
            if (seenNamesInMatch.has(nameKey) || seenNamesInTeam.has(nameKey))
                continue;
            seenNamesInTeam.add(nameKey);
            let user = userByEmail.get(tempEmail) ?? null;
            if (!user) {
                user = await database_1.default.user.create({
                    data: {
                        name: registeredPlayer.name,
                        email: tempEmail,
                        password: 'temp123',
                        role: 'player',
                        battingStyle: registeredPlayer.battingStyle,
                        bowlingStyle: registeredPlayer.bowlingStyle,
                        approved: true,
                    },
                });
                userByEmail.set(tempEmail, user);
            }
            if (!existingMatchPlayerIds.has(user.id)) {
                const matchPlayer = await database_1.default.matchPlayer.create({
                    data: {
                        matchId,
                        playerId: user.id,
                        team: tp.teamNumber,
                        status: 'approved',
                    },
                });
                createdPlayers.push(matchPlayer);
                seenNamesInMatch.add(nameKey);
                existingMatchPlayerIds.add(user.id);
            }
        }
        // Clean up any pre-existing duplicate match_player rows.
        const allMatchPlayers = await database_1.default.matchPlayer.findMany({
            where: { matchId },
            include: { player: { select: { name: true } } },
            orderBy: { id: 'asc' },
        });
        const seenKeys = new Set();
        const idsToDelete = [];
        for (const mp of allMatchPlayers) {
            const nm = mp.player?.name?.toLowerCase().trim() ?? '';
            const key = `${mp.team ?? 0}|${nm}`;
            if (seenKeys.has(key)) {
                idsToDelete.push(mp.id);
            }
            else {
                seenKeys.add(key);
            }
        }
        if (idsToDelete.length > 0) {
            await database_1.default.matchPlayer.deleteMany({ where: { id: { in: idsToDelete } } });
        }
        res.json({
            message: 'Match players populated successfully',
            count: createdPlayers.length,
            duplicatesRemoved: idsToDelete.length,
        });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
/**
 * Removes duplicate match_player entries by name.
 * Keeps the oldest entry (lowest id) for each unique (matchId, team, name) tuple.
 */
const dedupeMatchPlayers = async (req, res) => {
    try {
        const matchId = parseInt(req.params.id);
        const matchPlayers = await database_1.default.matchPlayer.findMany({
            where: { matchId },
            include: { player: { select: { name: true } } },
            orderBy: { id: 'asc' },
        });
        const seen = new Map(); // key: "team|name" → id of kept row
        const idsToDelete = [];
        for (const mp of matchPlayers) {
            const name = mp.player?.name?.toLowerCase().trim() ?? '';
            const key = `${mp.team ?? 0}|${name}`;
            if (seen.has(key)) {
                idsToDelete.push(mp.id);
            }
            else {
                seen.set(key, mp.id);
            }
        }
        if (idsToDelete.length > 0) {
            await database_1.default.matchPlayer.deleteMany({
                where: { id: { in: idsToDelete } },
            });
        }
        res.json({
            message: 'Duplicates removed',
            removed: idsToDelete.length,
            remaining: matchPlayers.length - idsToDelete.length,
        });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
exports.default = {
    joinMatch,
    getMatchPlayers,
    approveMatchPlayer,
    getApprovedPlayers,
    populateMatchPlayers,
    dedupeMatchPlayers,
};
//# sourceMappingURL=matchPlayerController.js.map
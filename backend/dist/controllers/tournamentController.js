"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const toSnake_1 = __importDefault(require("../utils/toSnake"));
const supabaseStorage_1 = __importDefault(require("../services/supabaseStorage"));
const getTournaments = async (req, res) => {
    const { status } = req.query;
    try {
        const tournaments = await database_1.default.tournament.findMany({
            where: status ? { status } : undefined,
            orderBy: { startDate: 'desc' },
        });
        res.json((0, toSnake_1.default)(tournaments));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const getTournamentById = async (req, res) => {
    try {
        const tournament = await database_1.default.tournament.findUnique({
            where: { id: parseInt(req.params.id) },
        });
        if (!tournament) {
            res.status(404).json({ error: 'Tournament not found' });
            return;
        }
        const teams = await database_1.default.tournamentTeam.findMany({
            where: { tournamentId: parseInt(req.params.id) },
            include: {
                team: {
                    select: { teamName: true },
                },
            },
            orderBy: { points: 'desc' },
        });
        res.json((0, toSnake_1.default)({
            ...tournament,
            teams: teams.map((tt) => ({
                id: tt.id,
                tournament_id: tt.tournamentId,
                team_id: tt.teamId,
                team_name: tt.team.teamName,
                group_name: tt.groupName,
                played: tt.played,
                won: tt.won,
                lost: tt.lost,
                no_result: tt.noResult,
                points: tt.points,
            })),
        }));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const createTournament = async (req, res) => {
    const { name, type, overs, start_date, end_date, venue, organizer } = req.body;
    try {
        const tournament = await database_1.default.tournament.create({
            data: {
                name,
                type: type || 'T20',
                overs: overs || 20,
                startDate: start_date ? new Date(start_date) : null,
                endDate: end_date ? new Date(end_date) : null,
                venue: venue || null,
                organizer: organizer || null,
                createdBy: req.user.id,
            },
        });
        res.status(201).json((0, toSnake_1.default)(tournament));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const addTeamToTournament = async (req, res) => {
    const { team_id, group } = req.body;
    try {
        await database_1.default.tournamentTeam.create({
            data: {
                tournamentId: parseInt(req.params.id),
                teamId: team_id,
                groupName: group || null,
            },
        });
        res.status(201).json({ message: 'Team added to tournament' });
    }
    catch (error) {
        const err = error;
        if (err.code === 'P2002') {
            res.status(400).json({ error: 'Team already in tournament' });
            return;
        }
        res.status(500).json({ error: err.message });
    }
};
const getTournamentFixtures = async (req, res) => {
    try {
        const fixtures = await database_1.default.tournamentFixture.findMany({
            where: { tournamentId: parseInt(req.params.id) },
            orderBy: { matchDate: 'asc' },
        });
        res.json((0, toSnake_1.default)(fixtures));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const getTournamentStandings = async (req, res) => {
    try {
        const standings = await database_1.default.tournamentTeam.findMany({
            where: { tournamentId: parseInt(req.params.id) },
            include: {
                team: {
                    select: { teamName: true },
                },
            },
            orderBy: [
                { groupName: 'asc' },
                { points: 'desc' },
                { won: 'desc' },
            ],
        });
        res.json((0, toSnake_1.default)(standings.map((s) => ({
            id: s.id,
            tournament_id: s.tournamentId,
            team_id: s.teamId,
            team_name: s.team.teamName,
            group_name: s.groupName,
            played: s.played,
            won: s.won,
            lost: s.lost,
            no_result: s.noResult,
            points: s.points,
        }))));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const getTournamentStats = async (req, res) => {
    try {
        const tournamentId = parseInt(req.params.id);
        // Get all matches in this tournament
        const matches = await database_1.default.match.findMany({
            where: { tournamentId },
            select: { id: true },
        });
        const matchIds = matches.map((m) => m.id);
        if (matchIds.length === 0) {
            res.json((0, toSnake_1.default)({
                top_scorers: [],
                top_wicket_takers: [],
                best_bowling: [],
                most_fours: [],
                most_sixes: [],
            }));
            return;
        }
        // Aggregate batting stats per player across all tournament matches
        const battingStats = await database_1.default.playerScore.groupBy({
            by: ['playerId'],
            where: { matchId: { in: matchIds } },
            _sum: {
                runsScored: true,
                ballsFaced: true,
                fours: true,
                sixes: true,
                wicketsTaken: true,
                runsConceded: true,
                oversBowled: true,
            },
            _count: { id: true },
        });
        // Get player names
        const playerIds = battingStats.map((b) => b.playerId);
        const players = await database_1.default.user.findMany({
            where: { id: { in: playerIds } },
            select: { id: true, name: true },
        });
        const playerMap = new Map(players.map((p) => [p.id, p.name]));
        // Top scorers (sorted by runs)
        const topScorers = battingStats
            .map((b) => ({
            player_id: b.playerId,
            name: playerMap.get(b.playerId) || 'Unknown',
            matches: b._count.id,
            runs: b._sum.runsScored || 0,
            balls: b._sum.ballsFaced || 0,
            fours: b._sum.fours || 0,
            sixes: b._sum.sixes || 0,
            strike_rate: (b._sum.ballsFaced || 0) > 0
                ? (((b._sum.runsScored || 0) * 100) / (b._sum.ballsFaced || 1)).toFixed(2)
                : '0',
        }))
            .filter((p) => p.runs > 0)
            .sort((a, b) => b.runs - a.runs)
            .slice(0, 10);
        // Top wicket-takers (sorted by wickets, then by economy)
        const topWicketTakers = battingStats
            .map((b) => {
            const wickets = b._sum.wicketsTaken || 0;
            const runsConceded = b._sum.runsConceded || 0;
            const overs = b._sum.oversBowled || 0;
            return {
                player_id: b.playerId,
                name: playerMap.get(b.playerId) || 'Unknown',
                matches: b._count.id,
                wickets,
                runs_conceded: runsConceded,
                overs_bowled: overs,
                economy: overs > 0 ? (runsConceded / overs).toFixed(2) : '0',
                average: wickets > 0 ? (runsConceded / wickets).toFixed(2) : '0',
            };
        })
            .filter((p) => p.wickets > 0)
            .sort((a, b) => b.wickets - a.wickets)
            .slice(0, 10);
        // Best bowling figures — single match best (most wickets, fewest runs)
        const allBowlingScores = await database_1.default.playerScore.findMany({
            where: { matchId: { in: matchIds }, wicketsTaken: { gt: 0 } },
            select: { playerId: true, wicketsTaken: true, runsConceded: true },
        });
        // Group by player and find their best match
        const bestByPlayer = new Map();
        for (const score of allBowlingScores) {
            const existing = bestByPlayer.get(score.playerId);
            if (!existing ||
                score.wicketsTaken > existing.wickets ||
                (score.wicketsTaken === existing.wickets && score.runsConceded < existing.runs)) {
                bestByPlayer.set(score.playerId, {
                    wickets: score.wicketsTaken,
                    runs: score.runsConceded,
                });
            }
        }
        const bestBowling = Array.from(bestByPlayer.entries())
            .map(([playerId, fig]) => ({
            player_id: playerId,
            name: playerMap.get(playerId) || 'Unknown',
            figures: `${fig.wickets}/${fig.runs}`,
            wickets: fig.wickets,
            runs_conceded: fig.runs,
        }))
            .sort((a, b) => b.wickets - a.wickets || a.runs_conceded - b.runs_conceded)
            .slice(0, 5);
        // Most fours / sixes
        const mostFours = topScorers.slice().sort((a, b) => b.fours - a.fours).slice(0, 5);
        const mostSixes = topScorers.slice().sort((a, b) => b.sixes - a.sixes).slice(0, 5);
        res.json((0, toSnake_1.default)({
            top_scorers: topScorers,
            top_wicket_takers: topWicketTakers,
            best_bowling: bestBowling,
            most_fours: mostFours,
            most_sixes: mostSixes,
        }));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const updateTournament = async (req, res) => {
    const tournamentId = parseInt(req.params.id);
    const { logo_url, name, type, overs, start_date, end_date, venue, organizer, status } = req.body;
    try {
        const data = {};
        if (logo_url !== undefined)
            data.logoUrl = logo_url || null;
        if (name)
            data.name = name;
        if (type)
            data.type = type;
        if (overs !== undefined)
            data.overs = overs;
        if (start_date !== undefined)
            data.startDate = start_date ? new Date(start_date) : null;
        if (end_date !== undefined)
            data.endDate = end_date ? new Date(end_date) : null;
        if (venue !== undefined)
            data.venue = venue || null;
        if (organizer !== undefined)
            data.organizer = organizer || null;
        if (status)
            data.status = status;
        if (Object.keys(data).length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }
        const tournament = await database_1.default.tournament.update({
            where: { id: tournamentId },
            data,
        });
        res.json((0, toSnake_1.default)(tournament));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const uploadTournamentLogo = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const tournamentId = parseInt(req.params.id);
        const tournament = await database_1.default.tournament.findUnique({ where: { id: tournamentId } });
        if (!tournament) {
            res.status(404).json({ error: 'Tournament not found' });
            return;
        }
        if (tournament.logoUrl && tournament.logoUrl.includes('supabase') && supabaseStorage_1.default.isConfigured()) {
            try {
                await supabaseStorage_1.default.deleteFile(tournament.logoUrl);
            }
            catch (_) { }
        }
        const fileName = `tournament_${tournamentId}_${Date.now()}`;
        const logoUrl = await supabaseStorage_1.default.uploadFile(req.file, fileName);
        const updated = await database_1.default.tournament.update({
            where: { id: tournamentId },
            data: { logoUrl },
        });
        res.json((0, toSnake_1.default)(updated));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
exports.default = {
    getTournaments,
    getTournamentById,
    createTournament,
    updateTournament,
    addTeamToTournament,
    getTournamentFixtures,
    getTournamentStandings,
    getTournamentStats,
    uploadTournamentLogo,
};
//# sourceMappingURL=tournamentController.js.map
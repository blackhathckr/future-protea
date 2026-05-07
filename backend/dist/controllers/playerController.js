"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const toSnake_1 = __importDefault(require("../utils/toSnake"));
const getPlayers = async (_req, res) => {
    try {
        const players = await database_1.default.user.findMany({
            where: { role: 'player' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                battingStyle: true,
                bowlingStyle: true,
                approved: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json((0, toSnake_1.default)(players));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const approvePlayer = async (req, res) => {
    try {
        await database_1.default.user.update({
            where: { id: parseInt(req.params.id) },
            data: { approved: true },
        });
        res.json({ message: 'Player approved' });
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
/**
 * Compute extended career stats (50s, 100s, bowling avg, best figures)
 * from individual match scores. Called by both journey endpoints.
 */
async function computeExtendedStats(playerId) {
    // Get all individual match scores for this player
    const allScores = await database_1.default.playerScore.findMany({
        where: { playerId },
        select: {
            runsScored: true,
            ballsFaced: true,
            fours: true,
            sixes: true,
            wicketsTaken: true,
            runsConceded: true,
            oversBowled: true,
            catches: true,
            isOut: true,
        },
    });
    // Aggregate stats
    let totalMatches = allScores.length;
    let totalRuns = 0;
    let totalBalls = 0;
    let totalFours = 0;
    let totalSixes = 0;
    let totalWickets = 0;
    let totalCatches = 0;
    let totalOvers = 0;
    let totalRunsConceded = 0;
    let highestScore = 0;
    let fifties = 0;
    let hundreds = 0;
    let timesOut = 0;
    // Best bowling: most wickets in a match, then fewest runs
    let bestBowlingWickets = 0;
    let bestBowlingRuns = 0;
    for (const s of allScores) {
        totalRuns += s.runsScored;
        totalBalls += s.ballsFaced;
        totalFours += s.fours;
        totalSixes += s.sixes;
        totalWickets += s.wicketsTaken;
        totalCatches += s.catches;
        totalOvers += s.oversBowled;
        totalRunsConceded += s.runsConceded;
        if (s.runsScored > highestScore)
            highestScore = s.runsScored;
        if (s.runsScored >= 100)
            hundreds++;
        else if (s.runsScored >= 50)
            fifties++;
        if (s.isOut)
            timesOut++;
        // Best bowling figures (highest wickets, lowest runs as tiebreaker)
        if (s.wicketsTaken > bestBowlingWickets ||
            (s.wicketsTaken === bestBowlingWickets && s.runsConceded < bestBowlingRuns)) {
            bestBowlingWickets = s.wicketsTaken;
            bestBowlingRuns = s.runsConceded;
        }
    }
    const strikeRate = totalBalls > 0 ? ((totalRuns * 100) / totalBalls).toFixed(2) : '0';
    const battingAverage = timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : (totalRuns > 0 ? totalRuns.toFixed(2) : '0');
    const bowlingEconomy = totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : '0';
    const bowlingAverage = totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '0';
    const bestBowling = totalWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : '-';
    return {
        total_matches: totalMatches,
        total_runs: totalRuns,
        highest_score: highestScore,
        total_balls_faced: totalBalls,
        total_fours: totalFours,
        total_sixes: totalSixes,
        fifties,
        hundreds,
        total_wickets: totalWickets,
        total_catches: totalCatches,
        strike_rate: strikeRate,
        batting_average: battingAverage,
        total_overs_bowled: totalOvers,
        total_runs_conceded: totalRunsConceded,
        bowling_economy: bowlingEconomy,
        bowling_average: bowlingAverage,
        best_bowling: bestBowling,
    };
}
const getPlayerJourney = async (req, res) => {
    const playerId = parseInt(req.params.id);
    try {
        const [user, matches] = await Promise.all([
            database_1.default.user.findUnique({
                where: { id: playerId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    battingStyle: true,
                    bowlingStyle: true,
                    phone: true,
                },
            }),
            database_1.default.playerScore.findMany({
                where: { playerId },
                include: {
                    match: {
                        select: {
                            team1Name: true,
                            team2Name: true,
                            matchDate: true,
                            status: true,
                            team1Score: true,
                            team1Wickets: true,
                            team2Score: true,
                            team2Wickets: true,
                            venue: true,
                            winner: true,
                        },
                    },
                },
                orderBy: { match: { matchDate: 'desc' } },
            }),
        ]);
        // Compute stats from already-fetched matches — no extra DB round trip
        const careerStats = (() => {
            let totalMatches = matches.length;
            let totalRuns = 0, totalBalls = 0, totalFours = 0, totalSixes = 0;
            let totalWickets = 0, totalCatches = 0, totalOvers = 0, totalRunsConceded = 0;
            let highestScore = 0, fifties = 0, hundreds = 0, timesOut = 0;
            let bestBowlingWickets = 0, bestBowlingRuns = 0;
            for (const s of matches) {
                totalRuns += s.runsScored;
                totalBalls += s.ballsFaced;
                totalFours += s.fours;
                totalSixes += s.sixes;
                totalWickets += s.wicketsTaken;
                totalCatches += s.catches;
                totalOvers += s.oversBowled;
                totalRunsConceded += s.runsConceded;
                if (s.runsScored > highestScore)
                    highestScore = s.runsScored;
                if (s.runsScored >= 100)
                    hundreds++;
                else if (s.runsScored >= 50)
                    fifties++;
                if (s.isOut)
                    timesOut++;
                if (s.wicketsTaken > bestBowlingWickets ||
                    (s.wicketsTaken === bestBowlingWickets && s.runsConceded < bestBowlingRuns)) {
                    bestBowlingWickets = s.wicketsTaken;
                    bestBowlingRuns = s.runsConceded;
                }
            }
            return {
                total_matches: totalMatches, total_runs: totalRuns, highest_score: highestScore,
                total_balls_faced: totalBalls, total_fours: totalFours, total_sixes: totalSixes,
                fifties, hundreds, total_wickets: totalWickets, total_catches: totalCatches,
                strike_rate: totalBalls > 0 ? ((totalRuns * 100) / totalBalls).toFixed(2) : '0',
                batting_average: timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : (totalRuns > 0 ? totalRuns.toFixed(2) : '0'),
                total_overs_bowled: totalOvers, total_runs_conceded: totalRunsConceded,
                bowling_economy: totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : '0',
                bowling_average: totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '0',
                best_bowling: totalWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : '-',
            };
        })();
        res.json((0, toSnake_1.default)({
            player: user,
            career_stats: careerStats,
            matches: matches.map((m) => ({
                ...m,
                team1_name: m.match.team1Name,
                team2_name: m.match.team2Name,
                match_date: m.match.matchDate,
                match_status: m.match.status,
                team1_score: m.match.team1Score,
                team1_wickets: m.match.team1Wickets,
                team2_score: m.match.team2Score,
                team2_wickets: m.match.team2Wickets,
                venue: m.match.venue,
                winner: m.match.winner,
            })),
        }));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
const getPlayerJourneyByName = async (req, res) => {
    const { name } = req.query;
    if (!name) {
        res.status(400).json({ error: 'Name parameter required' });
        return;
    }
    try {
        const user = await database_1.default.user.findFirst({
            where: {
                name: { contains: name, mode: 'insensitive' },
                role: 'player',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                battingStyle: true,
                bowlingStyle: true,
                phone: true,
            },
        });
        if (!user) {
            const registeredPlayer = await database_1.default.registeredPlayer.findFirst({
                where: { name: { contains: name, mode: 'insensitive' } },
            });
            if (!registeredPlayer) {
                res.status(404).json({ error: 'Player not found' });
                return;
            }
            res.json((0, toSnake_1.default)({ player: registeredPlayer, career_stats: null, matches: [] }));
            return;
        }
        const matches = await database_1.default.playerScore.findMany({
            where: { playerId: user.id },
            include: {
                match: {
                    select: {
                        team1Name: true,
                        team2Name: true,
                        matchDate: true,
                        status: true,
                        team1Score: true,
                        team1Wickets: true,
                        team2Score: true,
                        team2Wickets: true,
                        venue: true,
                        winner: true,
                    },
                },
            },
            orderBy: { match: { matchDate: 'desc' } },
        });
        // Compute stats from already-fetched matches — no extra DB round trip
        const careerStats = (() => {
            let totalMatches = matches.length;
            let totalRuns = 0, totalBalls = 0, totalFours = 0, totalSixes = 0;
            let totalWickets = 0, totalCatches = 0, totalOvers = 0, totalRunsConceded = 0;
            let highestScore = 0, fifties = 0, hundreds = 0, timesOut = 0;
            let bestBowlingWickets = 0, bestBowlingRuns = 0;
            for (const s of matches) {
                totalRuns += s.runsScored;
                totalBalls += s.ballsFaced;
                totalFours += s.fours;
                totalSixes += s.sixes;
                totalWickets += s.wicketsTaken;
                totalCatches += s.catches;
                totalOvers += s.oversBowled;
                totalRunsConceded += s.runsConceded;
                if (s.runsScored > highestScore)
                    highestScore = s.runsScored;
                if (s.runsScored >= 100)
                    hundreds++;
                else if (s.runsScored >= 50)
                    fifties++;
                if (s.isOut)
                    timesOut++;
                if (s.wicketsTaken > bestBowlingWickets ||
                    (s.wicketsTaken === bestBowlingWickets && s.runsConceded < bestBowlingRuns)) {
                    bestBowlingWickets = s.wicketsTaken;
                    bestBowlingRuns = s.runsConceded;
                }
            }
            return {
                total_matches: totalMatches, total_runs: totalRuns, highest_score: highestScore,
                total_balls_faced: totalBalls, total_fours: totalFours, total_sixes: totalSixes,
                fifties, hundreds, total_wickets: totalWickets, total_catches: totalCatches,
                strike_rate: totalBalls > 0 ? ((totalRuns * 100) / totalBalls).toFixed(2) : '0',
                batting_average: timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : (totalRuns > 0 ? totalRuns.toFixed(2) : '0'),
                total_overs_bowled: totalOvers, total_runs_conceded: totalRunsConceded,
                bowling_economy: totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : '0',
                bowling_average: totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '0',
                best_bowling: totalWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : '-',
            };
        })();
        res.json((0, toSnake_1.default)({
            player: user,
            career_stats: careerStats,
            matches: matches.map((m) => ({
                ...m,
                team1_name: m.match.team1Name,
                team2_name: m.match.team2Name,
                match_date: m.match.matchDate,
                match_status: m.match.status,
                team1_score: m.match.team1Score,
                team1_wickets: m.match.team1Wickets,
                team2_score: m.match.team2Score,
                team2_wickets: m.match.team2Wickets,
                venue: m.match.venue,
                winner: m.match.winner,
            })),
        }));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
/**
 * GET /api/players/me/profile
 * Returns the logged-in player's full profile:
 *   - user account fields
 *   - linked RegisteredPlayer record (matched by email or name)
 *   - career stats
 *   - last 5 match performances
 *   - upcoming matches
 *   - active/upcoming tournaments
 */
const getMyProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                photoUrl: true,
                battingStyle: true,
                bowlingStyle: true,
                dateOfBirth: true,
                approved: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Run all independent queries in parallel
        const [allScores, recentScores, upcomingMatches, tournaments, registeredPlayerByEmail] = await Promise.all([
            // All scores for career stats computation
            database_1.default.playerScore.findMany({
                where: { playerId: userId },
                select: {
                    runsScored: true,
                    ballsFaced: true,
                    fours: true,
                    sixes: true,
                    wicketsTaken: true,
                    runsConceded: true,
                    oversBowled: true,
                    catches: true,
                    isOut: true,
                },
            }),
            // Recent 10 scores with match info
            database_1.default.playerScore.findMany({
                where: { playerId: userId },
                include: {
                    match: {
                        select: {
                            id: true,
                            team1Name: true,
                            team2Name: true,
                            matchDate: true,
                            status: true,
                            team1Score: true,
                            team1Wickets: true,
                            team2Score: true,
                            team2Wickets: true,
                            venue: true,
                            winner: true,
                            tournamentId: true,
                        },
                    },
                },
                orderBy: { match: { matchDate: 'desc' } },
                take: 10,
            }),
            // Upcoming matches
            database_1.default.match.findMany({
                where: { status: 'upcoming', matchDate: { gte: new Date() } },
                orderBy: { matchDate: 'asc' },
                take: 5,
                select: {
                    id: true,
                    team1Name: true,
                    team2Name: true,
                    matchDate: true,
                    venue: true,
                    totalOvers: true,
                    matchType: true,
                    tournamentId: true,
                },
            }),
            // Active & upcoming tournaments
            database_1.default.tournament.findMany({
                where: { OR: [{ status: 'active' }, { status: 'upcoming' }] },
                orderBy: { startDate: 'asc' },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    venue: true,
                    organizer: true,
                    overs: true,
                },
            }),
            // RegisteredPlayer by email
            user.email
                ? database_1.default.registeredPlayer.findFirst({ where: { email: user.email } })
                : Promise.resolve(null),
        ]);
        // Fall back to name match if email lookup found nothing
        const registeredPlayer = registeredPlayerByEmail
            ?? await database_1.default.registeredPlayer.findFirst({
                where: { name: { equals: user.name, mode: 'insensitive' } },
            });
        // Compute career stats from the already-fetched allScores
        let totalMatches = allScores.length;
        let totalRuns = 0, totalBalls = 0, totalFours = 0, totalSixes = 0;
        let totalWickets = 0, totalCatches = 0, totalOvers = 0, totalRunsConceded = 0;
        let highestScore = 0, fifties = 0, hundreds = 0, timesOut = 0;
        let bestBowlingWickets = 0, bestBowlingRuns = 0;
        for (const s of allScores) {
            totalRuns += s.runsScored;
            totalBalls += s.ballsFaced;
            totalFours += s.fours;
            totalSixes += s.sixes;
            totalWickets += s.wicketsTaken;
            totalCatches += s.catches;
            totalOvers += s.oversBowled;
            totalRunsConceded += s.runsConceded;
            if (s.runsScored > highestScore)
                highestScore = s.runsScored;
            if (s.runsScored >= 100)
                hundreds++;
            else if (s.runsScored >= 50)
                fifties++;
            if (s.isOut)
                timesOut++;
            if (s.wicketsTaken > bestBowlingWickets ||
                (s.wicketsTaken === bestBowlingWickets && s.runsConceded < bestBowlingRuns)) {
                bestBowlingWickets = s.wicketsTaken;
                bestBowlingRuns = s.runsConceded;
            }
        }
        const careerStats = {
            total_matches: totalMatches,
            total_runs: totalRuns,
            highest_score: highestScore,
            total_balls_faced: totalBalls,
            total_fours: totalFours,
            total_sixes: totalSixes,
            fifties,
            hundreds,
            total_wickets: totalWickets,
            total_catches: totalCatches,
            strike_rate: totalBalls > 0 ? ((totalRuns * 100) / totalBalls).toFixed(2) : '0',
            batting_average: timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : (totalRuns > 0 ? totalRuns.toFixed(2) : '0'),
            total_overs_bowled: totalOvers,
            total_runs_conceded: totalRunsConceded,
            bowling_economy: totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : '0',
            bowling_average: totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '0',
            best_bowling: totalWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : '-',
        };
        res.json((0, toSnake_1.default)({
            user,
            registered_player: registeredPlayer,
            career_stats: careerStats,
            recent_scores: recentScores.map((s) => ({
                id: s.id,
                match_id: s.matchId,
                player_id: s.playerId,
                team: s.team,
                runs_scored: s.runsScored,
                balls_faced: s.ballsFaced,
                fours: s.fours,
                sixes: s.sixes,
                is_out: s.isOut,
                out_type: s.outType,
                overs_bowled: s.oversBowled,
                runs_conceded: s.runsConceded,
                wickets_taken: s.wicketsTaken,
                catches: s.catches,
                team1_name: s.match.team1Name,
                team2_name: s.match.team2Name,
                match_date: s.match.matchDate,
                match_status: s.match.status,
                team1_score: s.match.team1Score,
                team1_wickets: s.match.team1Wickets,
                team2_score: s.match.team2Score,
                team2_wickets: s.match.team2Wickets,
                venue: s.match.venue,
                winner: s.match.winner,
                tournament_id: s.match.tournamentId,
            })),
            upcoming_matches: upcomingMatches,
            tournaments,
        }));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
/**
 * GET /api/players/all
 * Returns all users with role='player' including basic info — for player browsing.
 */
const getAllPlayers = async (_req, res) => {
    try {
        const players = await database_1.default.user.findMany({
            where: { role: 'player' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                battingStyle: true,
                bowlingStyle: true,
                photoUrl: true,
                approved: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
        // Deduplicate by name (case-insensitive), keeping the row with the lowest id
        const seen = new Set();
        const unique = players.filter((p) => {
            const key = p.name.toLowerCase().trim();
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
        res.json((0, toSnake_1.default)(unique));
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
};
exports.default = {
    getPlayers,
    approvePlayer,
    getPlayerJourney,
    getPlayerJourneyByName,
    getMyProfile,
    getAllPlayers,
};
//# sourceMappingURL=playerController.js.map
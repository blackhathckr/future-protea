import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import { AuthRequest } from '../middleware/auth';
import LiveScoreService from '../services/liveScoreService';
import logger from '../utils/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute an over-count float from full overs + ball-in-over.
 * Ball 6 completes an over (e.g. over 2, ball 6 → 3.0).
 * Otherwise result is e.g. 2.3 for over 2, ball 3.
 */
function computeOvers(overNumber: number, ballNumber: number, ballsPerOver: number): number {
  if (ballNumber >= ballsPerOver) return overNumber + 1;
  return parseFloat(`${overNumber}.${ballNumber}`);
}

/**
 * Idempotency guard: returns existing ball if client_ball_id already recorded.
 */
async function findExistingBall(matchId: string, clientBallId: string | undefined) {
  if (!clientBallId) return null;
  return prisma.ball.findUnique({ where: { matchId_clientBallId: { matchId, clientBallId } } });
}

/**
 * Write an audit log entry. Fire-and-forget — never throws to the caller.
 */
async function writeAuditLog(
  actorUserId: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  before: Prisma.InputJsonValue | null,
  after: Prisma.InputJsonValue | null,
  ipAddress: string | undefined,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId ?? null,
        action,
        entityType,
        entityId,
        before:    before    !== null ? before    : Prisma.JsonNull,
        after:     after     !== null ? after     : Prisma.JsonNull,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (err) {
    logger.error('audit_log write failed:', err);
  }
}

// ---------------------------------------------------------------------------
// recordBall
// ---------------------------------------------------------------------------

const recordBall = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId = req.params.id as string;
  const {
    innings,
    over_number,
    ball_number,
    batsman_id,
    bowler_id,
    non_striker_id,
    fielder_id,
    runs,
    is_wide,
    is_noball,
    is_bye,
    is_legbye,
    is_wicket,
    wicket_type,
    dismissed_by_id,
    extras,
    overthrows,
    shot_direction,
    commentary,
    client_ball_id,
  } = req.body;

  try {
    // ── Idempotency: if this ball was already recorded, return it ──────────
    if (client_ball_id) {
      const existing = await findExistingBall(matchId, client_ball_id);
      if (existing) {
        res.status(201).json(toSnake({ ball: existing, match: await prisma.match.findUnique({ where: { id: matchId } }) }));
        return;
      }
    }

    const isWide   = is_wide   || false;
    const isNoball = is_noball || false;
    const isBye    = is_bye    || false;
    const isLegbye = is_legbye || false;
    const isWicket = is_wicket || false;
    const extraRuns = (extras || 0) + (overthrows || 0);
    const totalRuns = runs + extraRuns;
    const legalDelivery = !isWide && !isNoball;

    const result = await prisma.$transaction(async (tx) => {

      // ── 1. Fetch match to get balls-per-over setting ──────────────────────
      const match = await tx.match.findUnique({
        where: { id: matchId },
        select: { ballsPerOver: true, team1Name: true, team2Name: true },
      });
      if (!match) throw new Error('Match not found');
      const ballsPerOver = match.ballsPerOver || 6;

      // ── 2. Insert ball ─────────────────────────────────────────────────────
      const ball = await tx.ball.create({
        data: {
          matchId,
          clientBallId: client_ball_id ?? null,
          innings,
          overNumber: over_number,
          ballNumber: ball_number,
          batsmanId: batsman_id   || null,
          bowlerId:  bowler_id    || null,
          nonStrikerId: non_striker_id || null,
          fielderId:    fielder_id     || null,
          runs,
          isWide,
          isNoball,
          isBye,
          isLegbye,
          isWicket,
          wicketType:   wicket_type   || null,
          extras:       extras        || 0,
          overthrows:   overthrows    || 0,
          shotDirection: shot_direction || null,
          commentary:    commentary    || null,
          isActive: true,
        },
      });

      // ── 3. Upsert match_innings ─────────────────────────────────────────────
      const newOversFloat = computeOvers(over_number, ball_number, ballsPerOver);
      const inningsUpdate: Record<string, unknown> = {
        totalRuns:   { increment: totalRuns },
        totalBalls:  legalDelivery ? { increment: 1 } : undefined,
        totalOvers:  legalDelivery ? newOversFloat : undefined,
        totalWickets: isWicket ? { increment: 1 } : undefined,
        strikerId:   batsman_id   || undefined,
        nonStrikerId: non_striker_id || undefined,
        currentBowlerId: bowler_id || undefined,
      };
      if (isWide)   (inningsUpdate as Record<string, unknown>).extrasWides    = { increment: 1 + (extras || 0) };
      if (isNoball) (inningsUpdate as Record<string, unknown>).extrasNoballs  = { increment: 1 };
      if (isBye)    (inningsUpdate as Record<string, unknown>).extrasByes     = { increment: runs };
      if (isLegbye) (inningsUpdate as Record<string, unknown>).extrasLegbyes  = { increment: runs };

      // Remove undefined values — Prisma rejects them in nested objects
      Object.keys(inningsUpdate).forEach(
        (k) => inningsUpdate[k] === undefined && delete inningsUpdate[k],
      );

      await tx.matchInnings.upsert({
        where: { matchId_inningsNumber: { matchId, inningsNumber: innings } },
        create: {
          matchId,
          inningsNumber: innings,
          totalRuns,
          totalBalls:   legalDelivery ? 1 : 0,
          totalOvers:   legalDelivery ? newOversFloat : 0,
          totalWickets: isWicket ? 1 : 0,
          extrasWides:   isWide   ? 1 + (extras || 0) : 0,
          extrasNoballs: isNoball ? 1 : 0,
          extrasByes:    isBye    ? runs : 0,
          extrasLegbyes: isLegbye ? runs : 0,
          strikerId:         batsman_id    || null,
          nonStrikerId:      non_striker_id || null,
          currentBowlerId:   bowler_id     || null,
          status: 'in_progress',
          startedAt: new Date(),
        },
        update: inningsUpdate,
      });

      // ── 4. Update match flat totals (backward-compat with Flutter) ─────────
      const matchUpdateData: Record<string, unknown> = {};
      if (innings === 1) {
        matchUpdateData.team1Score   = { increment: totalRuns };
        if (isWicket) matchUpdateData.team1Wickets = { increment: 1 };
        if (legalDelivery) matchUpdateData.team1Overs = newOversFloat;
      } else {
        matchUpdateData.team2Score   = { increment: totalRuns };
        if (isWicket) matchUpdateData.team2Wickets = { increment: 1 };
        if (legalDelivery) matchUpdateData.team2Overs = newOversFloat;
      }
      await tx.match.update({ where: { id: matchId }, data: matchUpdateData });

      // ── 5. Upsert batsman player_score ─────────────────────────────────────
      if (batsman_id) {
        const batsmanTeam = innings === 1 ? 1 : 2;
        const batsmanRuns = (!isBye && !isLegbye) ? runs : 0;
        await tx.playerScore.upsert({
          where: { matchId_playerId: { matchId, playerId: batsman_id } },
          create: {
            matchId,
            playerId:   batsman_id,
            team:       batsmanTeam,
            runsScored: batsmanRuns,
            ballsFaced: legalDelivery ? 1 : 0,
            fours:      (batsmanRuns === 4) ? 1 : 0,
            sixes:      (batsmanRuns === 6) ? 1 : 0,
            isOut:      isWicket,
            outType:    wicket_type || null,
            dismissedById: dismissed_by_id || null,
            fielderId:     fielder_id      || null,
          },
          update: {
            runsScored: { increment: batsmanRuns },
            ballsFaced: { increment: legalDelivery ? 1 : 0 },
            fours:      { increment: (batsmanRuns === 4) ? 1 : 0 },
            sixes:      { increment: (batsmanRuns === 6) ? 1 : 0 },
            ...(isWicket && {
              isOut:         true,
              outType:       wicket_type || null,
              dismissedById: dismissed_by_id || null,
              fielderId:     fielder_id      || null,
            }),
          },
        });
      }

      // ── 6. Upsert bowler player_score ──────────────────────────────────────
      if (bowler_id) {
        const bowlerTeam = innings === 1 ? 2 : 1;
        const existing = await tx.playerScore.findUnique({
          where: { matchId_playerId: { matchId, playerId: bowler_id } },
          select: { oversBowled: true },
        });
        const prevOvers = existing?.oversBowled ?? 0;
        let newBowlerOvers = prevOvers;
        if (legalDelivery) {
          const prevBalls = Math.round((prevOvers % 1) * 10);
          if (prevBalls + 1 >= ballsPerOver) {
            newBowlerOvers = Math.floor(prevOvers) + 1;
          } else {
            newBowlerOvers = parseFloat(`${Math.floor(prevOvers)}.${prevBalls + 1}`);
          }
        }

        await tx.playerScore.upsert({
          where: { matchId_playerId: { matchId, playerId: bowler_id } },
          create: {
            matchId,
            playerId:     bowler_id,
            team:         bowlerTeam,
            runsConceded: totalRuns,
            wicketsTaken: isWicket ? 1 : 0,
            oversBowled:  newBowlerOvers,
          },
          update: {
            runsConceded: { increment: totalRuns },
            wicketsTaken: { increment: isWicket ? 1 : 0 },
            oversBowled:  newBowlerOvers,
          },
        });
      }

      // ── 7. Write fall_of_wickets on dismissal ──────────────────────────────
      if (isWicket && batsman_id) {
        const inningsRow = await tx.matchInnings.findUnique({
          where: { matchId_inningsNumber: { matchId, inningsNumber: innings } },
          select: { id: true, totalWickets: true, totalRuns: true, totalOvers: true },
        });
        if (inningsRow) {
          await tx.fallOfWicket.create({
            data: {
              matchId,
              inningsId:    inningsRow.id,
              wicketNumber: inningsRow.totalWickets,
              batsmanId:    batsman_id,
              dismissalType: wicket_type || 'unknown',
              bowlerId:     bowler_id    || null,
              fielderId:    fielder_id   || null,
              runsAtFall:   inningsRow.totalRuns,
              oversAtFall:  inningsRow.totalOvers,
            },
          });
        }
      }

      // ── 8. Update partnership ──────────────────────────────────────────────
      if (batsman_id) {
        const inningsRow = await tx.matchInnings.findUnique({
          where: { matchId_inningsNumber: { matchId, inningsNumber: innings } },
          select: { id: true, totalWickets: true, totalRuns: true, totalOvers: true },
        });
        if (inningsRow) {
          const wicketNum = isWicket
            ? inningsRow.totalWickets - 1   // wicket was just incremented, partnership is for the previous wicket
            : inningsRow.totalWickets;

          const partnershipKey = {
            matchId,
            inningsId:    inningsRow.id,
            wicketNumber: wicketNum,
          };
          const existingPartnership = await tx.partnership.findUnique({
            where: { matchId_inningsId_wicketNumber: partnershipKey },
          });

          const batsmanRuns = (!isBye && !isLegbye) ? runs : 0;
          const partnerId = non_striker_id || null;

          if (!existingPartnership && partnerId) {
            await tx.partnership.create({
              data: {
                ...partnershipKey,
                batsman1Id:    batsman_id,
                batsman2Id:    partnerId,
                runs:          totalRuns,
                balls:         legalDelivery ? 1 : 0,
                fours:         (batsmanRuns === 4) ? 1 : 0,
                sixes:         (batsmanRuns === 6) ? 1 : 0,
                batsman1Runs:  batsmanRuns,
                batsman2Runs:  0,
                startedAtScore: (inningsRow.totalRuns - totalRuns),
                startedOver:   inningsRow.totalOvers,
                unbroken:      !isWicket,
              },
            });
          } else if (existingPartnership) {
            const isBatsman1 = existingPartnership.batsman1Id === batsman_id;
            await tx.partnership.update({
              where: { matchId_inningsId_wicketNumber: partnershipKey },
              data: {
                runs:  { increment: totalRuns },
                balls: { increment: legalDelivery ? 1 : 0 },
                fours: { increment: (batsmanRuns === 4) ? 1 : 0 },
                sixes: { increment: (batsmanRuns === 6) ? 1 : 0 },
                ...(isBatsman1
                  ? { batsman1Runs: { increment: batsmanRuns } }
                  : { batsman2Runs: { increment: batsmanRuns } }),
                ...(isWicket && {
                  unbroken:    false,
                  endedAtScore: inningsRow.totalRuns,
                  endedOver:    inningsRow.totalOvers,
                }),
              },
            });
          }
        }
      }

      const updatedMatch = await tx.match.findUnique({ where: { id: matchId } });
      return { ball, match: updatedMatch };
    });

    // ── Publish live update to Redis (outside transaction — non-critical) ────
    try {
      const [batsman, bowler] = await Promise.all([
        batsman_id ? prisma.registeredPlayer.findUnique({ where: { id: batsman_id }, select: { name: true } }) : null,
        bowler_id  ? prisma.registeredPlayer.findUnique({ where: { id: bowler_id  }, select: { name: true } }) : null,
      ]);
      const currentScore   = innings === 1 ? result.match?.team1Score   : result.match?.team2Score;
      const currentWickets = innings === 1 ? result.match?.team1Wickets : result.match?.team2Wickets;

      await LiveScoreService.publishScoreUpdate(matchId, {
        matchId,
        innings,
        over:        over_number,
        ball:        ball_number,
        runs:        runs + (extras || 0) + (overthrows || 0),
        totalRuns:   currentScore   || 0,
        wickets:     currentWickets || 0,
        batsmanName: batsman?.name  || 'Unknown',
        bowlerName:  bowler?.name   || 'Unknown',
        commentary:  commentary     || `${batsman?.name ?? 'Batter'} ${runs} run${runs !== 1 ? 's' : ''}`,
        timestamp:   new Date().toISOString(),
      });
    } catch (pubErr) {
      logger.error('Redis publish failed (non-fatal):', pubErr);
    }

    res.status(201).json(toSnake(result));
  } catch (error: unknown) {
    const err = error as { message: string };
    logger.error('recordBall error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// getBalls  — only active balls, with player names
// ---------------------------------------------------------------------------

const getBalls = async (req: Request, res: Response): Promise<void> => {
  const { innings } = req.query as { innings?: string };
  try {
    const balls = await prisma.ball.findMany({
      where: {
        matchId:  req.params.id as string,
        isActive: true,
        ...(innings && { innings: parseInt(innings) }),
      },
      include: {
        batsman:    { select: { name: true } },
        bowler:     { select: { name: true } },
        nonStriker: { select: { name: true } },
      },
      orderBy: [
        { innings:    'asc' },
        { overNumber: 'asc' },
        { ballNumber: 'asc' },
      ],
    });

    res.json(toSnake(balls.map((b) => ({
      ...b,
      batsman_name:     b.batsman?.name     ?? null,
      bowler_name:      b.bowler?.name      ?? null,
      non_striker_name: b.nonStriker?.name  ?? null,
    }))));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// deleteLastBall  — soft delete (is_active = false) + full stat rollback
// ---------------------------------------------------------------------------

const deleteLastBall = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId  = req.params.id as string;
  const { innings } = req.query as { innings?: string };
  const actorIp  = req.ip;

  try {
    const result = await prisma.$transaction(async (tx) => {

      // Find the last ACTIVE ball
      const lastBall = await tx.ball.findFirst({
        where: {
          matchId,
          isActive: true,
          ...(innings && { innings: parseInt(innings) }),
        },
        orderBy: [
          { innings:    'desc' },
          { overNumber: 'desc' },
          { ballNumber: 'desc' },
        ],
      });

      if (!lastBall) throw new Error('No balls to undo');

      // Soft-delete: mark inactive
      await tx.ball.update({
        where: { id: lastBall.id },
        data:  { isActive: false },
      });

      const totalRuns    = lastBall.runs + (lastBall.extras || 0) + (lastBall.overthrows || 0);
      const legalDelivery = !lastBall.isWide && !lastBall.isNoball;

      // ── Rollback match_innings ──────────────────────────────────────────────
      const inningsRow = await tx.matchInnings.findUnique({
        where: { matchId_inningsNumber: { matchId, inningsNumber: lastBall.innings } },
        select: { id: true, totalOvers: true, totalBalls: true, totalWickets: true, totalRuns: true },
      });

      if (inningsRow) {
        const match = await tx.match.findUnique({
          where: { id: matchId },
          select: { ballsPerOver: true },
        });
        const ballsPerOver = match?.ballsPerOver || 6;

        // Recalculate overs by going one ball back
        let prevOvers = inningsRow.totalOvers;
        if (legalDelivery && prevOvers > 0) {
          const prevBalls = Math.round((prevOvers % 1) * 10);
          if (prevBalls === 0) {
            const completedOvers = Math.floor(prevOvers);
            prevOvers = parseFloat(`${completedOvers - 1}.${ballsPerOver - 1}`);
          } else {
            prevOvers = parseFloat(`${Math.floor(prevOvers)}.${prevBalls - 1}`);
          }
          prevOvers = Math.max(0, prevOvers);
        }

        const inningsRollback: Record<string, unknown> = {
          totalRuns:    { decrement: totalRuns },
          totalBalls:   legalDelivery ? { decrement: 1 } : undefined,
          totalOvers:   legalDelivery ? prevOvers : undefined,
          totalWickets: lastBall.isWicket ? { decrement: 1 } : undefined,
        };
        if (lastBall.isWide)   (inningsRollback as Record<string, unknown>).extrasWides   = { decrement: 1 + (lastBall.extras || 0) };
        if (lastBall.isNoball) (inningsRollback as Record<string, unknown>).extrasNoballs = { decrement: 1 };
        if (lastBall.isBye)    (inningsRollback as Record<string, unknown>).extrasByes    = { decrement: lastBall.runs };
        if (lastBall.isLegbye) (inningsRollback as Record<string, unknown>).extrasLegbyes = { decrement: lastBall.runs };

        Object.keys(inningsRollback).forEach(
          (k) => inningsRollback[k] === undefined && delete inningsRollback[k],
        );

        await tx.matchInnings.update({
          where: { id: inningsRow.id },
          data:  inningsRollback,
        });

        // Delete fall_of_wickets for this wicket if it was a dismissal
        if (lastBall.isWicket && lastBall.batsmanId) {
          await tx.fallOfWicket.deleteMany({
            where: {
              inningsId: inningsRow.id,
              batsmanId: lastBall.batsmanId,
              runsAtFall: inningsRow.totalRuns,
            },
          });
        }

        // Rollback partnership
        if (lastBall.batsmanId) {
          const wicketNum = lastBall.isWicket
            ? (inningsRow.totalWickets - 1)
            : inningsRow.totalWickets;
          const partnershipKey = {
            matchId,
            inningsId:    inningsRow.id,
            wicketNumber: wicketNum,
          };
          const partnership = await tx.partnership.findUnique({
            where: { matchId_inningsId_wicketNumber: partnershipKey },
          });
          if (partnership) {
            const batsmanRuns = (!lastBall.isBye && !lastBall.isLegbye) ? lastBall.runs : 0;
            const isBatsman1 = partnership.batsman1Id === lastBall.batsmanId;
            await tx.partnership.update({
              where: { matchId_inningsId_wicketNumber: partnershipKey },
              data: {
                runs:  { decrement: totalRuns },
                balls: { decrement: legalDelivery ? 1 : 0 },
                fours: { decrement: (batsmanRuns === 4) ? 1 : 0 },
                sixes: { decrement: (batsmanRuns === 6) ? 1 : 0 },
                ...(isBatsman1
                  ? { batsman1Runs: { decrement: batsmanRuns } }
                  : { batsman2Runs: { decrement: batsmanRuns } }),
                ...(lastBall.isWicket && { unbroken: true, endedAtScore: null, endedOver: null }),
              },
            });
          }
        }
      }

      // ── Rollback match flat totals ──────────────────────────────────────────
      const matchUpdateData: Record<string, unknown> = {};
      if (lastBall.innings === 1) {
        matchUpdateData.team1Score = { decrement: totalRuns };
        if (lastBall.isWicket) matchUpdateData.team1Wickets = { decrement: 1 };
      } else {
        matchUpdateData.team2Score = { decrement: totalRuns };
        if (lastBall.isWicket) matchUpdateData.team2Wickets = { decrement: 1 };
      }
      await tx.match.update({ where: { id: matchId }, data: matchUpdateData });

      // ── Rollback batsman player_score ──────────────────────────────────────
      if (lastBall.batsmanId) {
        const existing = await tx.playerScore.findUnique({
          where: { matchId_playerId: { matchId, playerId: lastBall.batsmanId } },
        });
        if (existing) {
          const batsmanRuns = (!lastBall.isBye && !lastBall.isLegbye) ? lastBall.runs : 0;
          await tx.playerScore.update({
            where: { matchId_playerId: { matchId, playerId: lastBall.batsmanId } },
            data: {
              runsScored: { decrement: batsmanRuns },
              ballsFaced: { decrement: legalDelivery ? 1 : 0 },
              fours:      { decrement: (batsmanRuns === 4) ? 1 : 0 },
              sixes:      { decrement: (batsmanRuns === 6) ? 1 : 0 },
              ...(lastBall.isWicket && { isOut: false, outType: null, dismissedById: null, fielderId: null }),
            },
          });
        }
      }

      // ── Rollback bowler player_score ───────────────────────────────────────
      if (lastBall.bowlerId) {
        const bowlerScore = await tx.playerScore.findUnique({
          where: { matchId_playerId: { matchId, playerId: lastBall.bowlerId } },
          select: { oversBowled: true },
        });
        if (bowlerScore) {
          const match = await tx.match.findUnique({ where: { id: matchId }, select: { ballsPerOver: true } });
          const ballsPerOver = match?.ballsPerOver || 6;
          let prevOvers = bowlerScore.oversBowled;
          if (legalDelivery && prevOvers > 0) {
            const prevBalls = Math.round((prevOvers % 1) * 10);
            if (prevBalls === 0) {
              prevOvers = parseFloat(`${Math.floor(prevOvers) - 1}.${ballsPerOver - 1}`);
            } else {
              prevOvers = parseFloat(`${Math.floor(prevOvers)}.${prevBalls - 1}`);
            }
            prevOvers = Math.max(0, prevOvers);
          }
          await tx.playerScore.update({
            where: { matchId_playerId: { matchId, playerId: lastBall.bowlerId } },
            data: {
              runsConceded: { decrement: totalRuns },
              wicketsTaken: { decrement: lastBall.isWicket ? 1 : 0 },
              oversBowled:  prevOvers,
            },
          });
        }
      }

      const updatedMatch = await tx.match.findUnique({ where: { id: matchId } });
      return { undoedBall: lastBall, match: updatedMatch };
    });

    // ── Audit log (fire-and-forget) ─────────────────────────────────────────
    await writeAuditLog(
      req.user?.id,
      'ball_undo',
      'ball',
      result.undoedBall.id,
      { isActive: true },
      { isActive: false },
      actorIp,
    );

    // ── Publish undo event to Redis ─────────────────────────────────────────
    try {
      const currentScore   = result.undoedBall.innings === 1 ? result.match?.team1Score   : result.match?.team2Score;
      const currentWickets = result.undoedBall.innings === 1 ? result.match?.team1Wickets : result.match?.team2Wickets;
      await LiveScoreService.publishScoreUpdate(matchId, {
        matchId,
        innings:     result.undoedBall.innings,
        over:        result.undoedBall.overNumber,
        ball:        result.undoedBall.ballNumber,
        runs:        0,
        totalRuns:   currentScore   || 0,
        wickets:     currentWickets || 0,
        batsmanName: 'Undo',
        bowlerName:  '',
        commentary:  'Last ball undone',
        timestamp:   new Date().toISOString(),
      });
    } catch (pubErr) {
      logger.error('Redis publish failed on undo (non-fatal):', pubErr);
    }

    res.json(toSnake(result));
  } catch (error: unknown) {
    const err = error as { message: string };
    logger.error('deleteLastBall error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// markRetiredHurt / clearRetiredHurt
// ---------------------------------------------------------------------------

const markRetiredHurt = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId  = req.params.matchId as string;
  const playerId = req.params.playerId as string;
  try {
    const playerScore = await prisma.playerScore.upsert({
      where:  { matchId_playerId: { matchId, playerId } },
      create: { matchId, playerId, outType: 'retired_hurt' },
      update: { outType: 'retired_hurt' },
    });
    res.json(toSnake(playerScore));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const clearRetiredHurt = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId  = req.params.matchId as string;
  const playerId = req.params.playerId as string;
  try {
    const playerScore = await prisma.playerScore.update({
      where: { matchId_playerId: { matchId, playerId } },
      data:  { outType: null },
    });
    res.json(toSnake(playerScore));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// abandonMatch  — POST /matches/:id/abandon
// ---------------------------------------------------------------------------

const abandonMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId = req.params.id as string;
  const { reason } = req.body;
  try {
    const match = await prisma.$transaction(async (tx) => {
      // Close any in-progress innings
      await tx.matchInnings.updateMany({
        where: { matchId, status: 'in_progress' },
        data:  { status: 'abandoned', endedAt: new Date() },
      });
      return tx.match.update({
        where: { id: matchId },
        data:  { status: 'abandoned' },
      });
    });

    await writeAuditLog(
      req.user?.id,
      'match_abandoned',
      'match',
      matchId,
      null,
      { reason: reason ?? null },
      req.ip,
    );

    try {
      await LiveScoreService.publishScoreUpdate(matchId, {
        matchId,
        innings:     match.currentInnings ?? 1,
        over:        0,
        ball:        0,
        runs:        0,
        totalRuns:   0,
        wickets:     0,
        batsmanName: '',
        bowlerName:  '',
        commentary:  `Match abandoned${reason ? `: ${reason}` : ''}`,
        timestamp:   new Date().toISOString(),
      });
    } catch (pubErr) {
      logger.error('Redis publish failed on abandon (non-fatal):', pubErr);
    }

    res.json(toSnake(match));
  } catch (error: unknown) {
    const err = error as { message: string };
    logger.error('abandonMatch error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// penaltyRuns  — POST /matches/:id/penalty
// Body: { innings, runs, reason? }
// ---------------------------------------------------------------------------

const penaltyRuns = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId = req.params.id as string;
  const { innings, runs, reason } = req.body;

  if (!innings || !runs || runs <= 0) {
    res.status(400).json({ error: 'innings and runs (> 0) are required' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Apply penalty to match_innings extras
      await tx.matchInnings.upsert({
        where: { matchId_inningsNumber: { matchId, inningsNumber: innings } },
        create: {
          matchId,
          inningsNumber:    innings,
          totalRuns:        runs,
          extrasPenalties:  runs,
          status:           'in_progress',
          startedAt:        new Date(),
        },
        update: {
          totalRuns:       { increment: runs },
          extrasPenalties: { increment: runs },
        },
      });

      // Reflect on match flat totals for backward-compat
      const matchUpdate: Record<string, unknown> = innings === 1
        ? { team1Score: { increment: runs } }
        : { team2Score: { increment: runs } };
      return tx.match.update({ where: { id: matchId }, data: matchUpdate });
    });

    await writeAuditLog(
      req.user?.id,
      'penalty_runs',
      'match',
      matchId,
      null,
      { innings, runs, reason: reason ?? null },
      req.ip,
    );

    try {
      const score = innings === 1 ? result.team1Score : result.team2Score;
      await LiveScoreService.publishScoreUpdate(matchId, {
        matchId,
        innings,
        over:        0,
        ball:        0,
        runs,
        totalRuns:   score ?? 0,
        wickets:     0,
        batsmanName: '',
        bowlerName:  '',
        commentary:  `Penalty: ${runs} run${runs !== 1 ? 's' : ''} awarded${reason ? ` (${reason})` : ''}`,
        timestamp:   new Date().toISOString(),
      });
    } catch (pubErr) {
      logger.error('Redis publish failed on penalty (non-fatal):', pubErr);
    }

    res.json(toSnake(result));
  } catch (error: unknown) {
    const err = error as { message: string };
    logger.error('penaltyRuns error:', err);
    res.status(500).json({ error: err.message });
  }
};

export default { recordBall, getBalls, deleteLastBall, markRetiredHurt, clearRetiredHurt, abandonMatch, penaltyRuns };

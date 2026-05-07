import { Request, Response } from 'express';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import { AuthRequest } from '../middleware/auth';

const recordBall = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId = parseInt(req.params.id as string);
  const {
    innings, over_number, ball_number, batsman_id, bowler_id,
    runs, is_wide, is_noball, is_bye, is_legbye, is_wicket, wicket_type, extras, commentary,
    overthrows, shot_direction,
  } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ball = await tx.ball.create({
        data: {
          matchId,
          innings,
          overNumber: over_number,
          ballNumber: ball_number,
          batsmanId: batsman_id,
          bowlerId: bowler_id,
          runs,
          isWide: is_wide || false,
          isNoball: is_noball || false,
          isBye: is_bye || false,
          isLegbye: is_legbye || false,
          isWicket: is_wicket || false,
          wicketType: wicket_type || null,
          extras: extras || 0,
          overthrows: overthrows || 0,
          shotDirection: shot_direction || null,
          commentary: commentary || null,
        },
      });

      const totalRuns = runs + (extras || 0) + (overthrows || 0);
      const teamField = innings === 1 ? 'team1' : 'team2';
      const updateData: Record<string, unknown> = {};

      if (teamField === 'team1') {
        updateData.team1Score = { increment: totalRuns };
        if (is_wicket) updateData.team1Wickets = { increment: 1 };
        if (!is_wide && !is_noball) {
          updateData.team1Overs = ball_number === 6 ? over_number + 1 : over_number + ball_number * 0.1;
        }
      } else {
        updateData.team2Score = { increment: totalRuns };
        if (is_wicket) updateData.team2Wickets = { increment: 1 };
        if (!is_wide && !is_noball) {
          updateData.team2Overs = ball_number === 6 ? over_number + 1 : over_number + ball_number * 0.1;
        }
      }

      await tx.match.update({
        where: { id: matchId },
        data: updateData,
      });

      if (batsman_id) {
        const batsmanTeam = innings === 1 ? 1 : 2;
        await tx.playerScore.upsert({
          where: {
            matchId_playerId: {
              matchId,
              playerId: batsman_id,
            },
          },
          create: {
            matchId,
            playerId: batsman_id,
            team: batsmanTeam,
            runsScored: (!is_bye && !is_legbye) ? runs : 0,
            ballsFaced: (!is_wide && !is_noball) ? 1 : 0,
            fours: (runs === 4 && !is_bye && !is_legbye) ? 1 : 0,
            sixes: (runs === 6 && !is_bye && !is_legbye) ? 1 : 0,
            isOut: is_wicket || false,
            outType: wicket_type || null,
          },
          update: {
            runsScored: { increment: (!is_bye && !is_legbye) ? runs : 0 },
            ballsFaced: { increment: (!is_wide && !is_noball) ? 1 : 0 },
            fours: { increment: (runs === 4 && !is_bye && !is_legbye) ? 1 : 0 },
            sixes: { increment: (runs === 6 && !is_bye && !is_legbye) ? 1 : 0 },
            isOut: is_wicket ? true : undefined,
            outType: wicket_type || undefined,
          },
        });
      }

      if (bowler_id) {
        const bowlerTeam = innings === 1 ? 2 : 1;
        const legalDelivery = !is_wide && !is_noball;

        const currentScore = await tx.playerScore.findUnique({
          where: {
            matchId_playerId: {
              matchId,
              playerId: bowler_id,
            },
          },
        });

        let newOvers = currentScore?.oversBowled || 0;
        if (legalDelivery) {
          if (ball_number === 6) {
            newOvers = Math.floor(newOvers) + 1;
          } else {
            newOvers += 0.1;
          }
        }

        await tx.playerScore.upsert({
          where: {
            matchId_playerId: {
              matchId,
              playerId: bowler_id,
            },
          },
          create: {
            matchId,
            playerId: bowler_id,
            team: bowlerTeam,
            runsConceded: totalRuns,
            wicketsTaken: is_wicket ? 1 : 0,
            oversBowled: newOvers,
          },
          update: {
            runsConceded: { increment: totalRuns },
            wicketsTaken: { increment: is_wicket ? 1 : 0 },
            oversBowled: newOvers,
          },
        });
      }

      const updatedMatch = await tx.match.findUnique({
        where: { id: matchId },
      });

      return { ball, match: updatedMatch };
    });

    res.status(201).json(toSnake(result));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const getBalls = async (req: Request, res: Response): Promise<void> => {
  const { innings } = req.query as { innings?: string };
  try {
    const balls = await prisma.ball.findMany({
      where: {
        matchId: parseInt(req.params.id as string),
        ...(innings && { innings: parseInt(innings) }),
      },
      include: {
        batsman: { select: { name: true } },
        bowler: { select: { name: true } },
      },
      orderBy: [
        { innings: 'asc' },
        { overNumber: 'asc' },
        { ballNumber: 'asc' },
      ],
    });
    res.json(toSnake(balls.map((b) => ({
      ...b,
      batsman_name: b.batsman?.name,
      bowler_name: b.bowler?.name,
    }))));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const deleteLastBall = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId = parseInt(req.params.id as string);
  const { innings } = req.query as { innings?: string };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const lastBall = await tx.ball.findFirst({
        where: {
          matchId,
          ...(innings && { innings: parseInt(innings) }),
        },
        orderBy: [
          { innings: 'desc' },
          { overNumber: 'desc' },
          { ballNumber: 'desc' },
        ],
      });

      if (!lastBall) {
        throw new Error('No balls to undo');
      }

      await tx.ball.delete({
        where: { id: lastBall.id },
      });

      const totalRuns = lastBall.runs + (lastBall.extras || 0) + (lastBall.overthrows || 0);
      const teamField = lastBall.innings === 1 ? 'team1' : 'team2';
      const updateData: Record<string, unknown> = {};

      if (teamField === 'team1') {
        updateData.team1Score = { decrement: totalRuns };
        if (lastBall.isWicket) updateData.team1Wickets = { decrement: 1 };
      } else {
        updateData.team2Score = { decrement: totalRuns };
        if (lastBall.isWicket) updateData.team2Wickets = { decrement: 1 };
      }

      await tx.match.update({
        where: { id: matchId },
        data: updateData,
      });

      if (lastBall.batsmanId) {
        const batsmanScore = await tx.playerScore.findUnique({
          where: {
            matchId_playerId: {
              matchId,
              playerId: lastBall.batsmanId,
            },
          },
        });

        if (batsmanScore) {
          await tx.playerScore.update({
            where: {
              matchId_playerId: {
                matchId,
                playerId: lastBall.batsmanId,
              },
            },
            data: {
              runsScored: { decrement: (!lastBall.isBye && !lastBall.isLegbye) ? lastBall.runs : 0 },
              ballsFaced: { decrement: (!lastBall.isWide && !lastBall.isNoball) ? 1 : 0 },
              fours: { decrement: (lastBall.runs === 4 && !lastBall.isBye && !lastBall.isLegbye) ? 1 : 0 },
              sixes: { decrement: (lastBall.runs === 6 && !lastBall.isBye && !lastBall.isLegbye) ? 1 : 0 },
              isOut: lastBall.isWicket ? false : undefined,
              outType: lastBall.isWicket ? null : undefined,
            },
          });
        }
      }

      if (lastBall.bowlerId) {
        const bowlerScore = await tx.playerScore.findUnique({
          where: {
            matchId_playerId: {
              matchId,
              playerId: lastBall.bowlerId,
            },
          },
        });

        if (bowlerScore) {
          const legalDelivery = !lastBall.isWide && !lastBall.isNoball;
          let newOvers = bowlerScore.oversBowled;

          if (legalDelivery) {
            const ballNum = lastBall.ballNumber;
            if (ballNum === 6) {
              newOvers = Math.floor(newOvers - 1);
            } else {
              newOvers -= 0.1;
            }
            newOvers = Math.max(0, newOvers);
          }

          await tx.playerScore.update({
            where: {
              matchId_playerId: {
                matchId,
                playerId: lastBall.bowlerId,
              },
            },
            data: {
              runsConceded: { decrement: totalRuns },
              wicketsTaken: { decrement: lastBall.isWicket ? 1 : 0 },
              oversBowled: newOvers,
            },
          });
        }
      }

      const updatedMatch = await tx.match.findUnique({
        where: { id: matchId },
      });

      return { deletedBall: lastBall, match: updatedMatch };
    });

    res.json(toSnake(result));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const markRetiredHurt = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId = parseInt(req.params.matchId as string);
  const playerId = parseInt(req.params.playerId as string);

  try {
    const playerScore = await prisma.playerScore.update({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
      data: {
        outType: 'retired hurt',
      },
    });

    res.json(toSnake(playerScore));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const clearRetiredHurt = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId = parseInt(req.params.matchId as string);
  const playerId = parseInt(req.params.playerId as string);

  try {
    const playerScore = await prisma.playerScore.update({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
      data: {
        outType: null,
      },
    });

    res.json(toSnake(playerScore));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

export default { recordBall, getBalls, deleteLastBall, markRetiredHurt, clearRetiredHurt };

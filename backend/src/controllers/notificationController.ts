import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';

const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // For now, return 0 as there's no notification system implemented yet
    res.json({ count: 0 });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

export default { getUnreadCount };

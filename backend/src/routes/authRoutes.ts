import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.post('/register', authController.register as any);
router.post('/login', authController.login as any);
router.post('/refresh', authController.refreshToken as any);
router.get('/me', authenticate, authController.getMe as any);
router.put('/profile', authenticate, authController.updateProfile as any);
router.post('/profile/photo', authenticate, upload.single('photo'), authController.uploadProfilePhoto as any);
router.delete('/profile/photo', authenticate, authController.deleteProfilePhoto as any);
router.post('/change-password', authenticate, authController.changePassword as any);
router.post('/forgot-password', authController.forgotPassword as any);
router.post('/reset-password', authController.resetPassword as any);

export default router;

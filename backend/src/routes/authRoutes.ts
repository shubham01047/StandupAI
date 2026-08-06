import { Router } from 'express';
import { signup, login, refresh, logout, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public auth endpoints
router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected endpoint
router.get('/me', authenticateToken, getMe);

export default router;

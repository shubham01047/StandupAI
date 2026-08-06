import { Router } from 'express';
import { createTeam, joinTeam, getMyTeam, leaveTeam } from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All team routes require JWT authentication
router.use(authenticateToken);

router.post('/create', createTeam);
router.post('/join', joinTeam);
router.get('/my-team', getMyTeam);
router.post('/leave', leaveTeam);

export default router;

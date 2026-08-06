import { Router } from 'express';
import { createOrUpdateStandup, getTeamStandups, getMyStandups } from '../controllers/standupController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All standup endpoints require JWT authentication
router.use(authenticateToken);

router.post('/', createOrUpdateStandup);
router.get('/team', getTeamStandups);
router.get('/my', getMyStandups);

export default router;

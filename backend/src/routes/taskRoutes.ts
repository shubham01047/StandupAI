import { Router } from 'express';
import { getTeamTasks, updateTaskStatus } from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All task endpoints require JWT authentication
router.use(authenticateToken);

router.get('/team', getTeamTasks);
router.put('/:id/status', updateTaskStatus);

export default router;

import { Request, Response } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { broadcastTaskUpdated } from '../services/socketService';

const updateStatusSchema = z.object({
  status: z.enum(['todo', 'in-progress', 'blocked', 'done']),
});

/**
 * Get all tasks for current user's team
 */
export const getTeamTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.teamId) {
      res.json({ tasks: [] });
      return;
    }

    const tasks = await Task.find({ teamId: user.teamId })
      .populate('ownerId', 'name email role')
      .sort({ updatedAt: -1 });

    res.json({ tasks });
  } catch (error: any) {
    console.error('[TaskController] Get team tasks error:', error);
    res.status(500).json({ message: 'Server error fetching team tasks', error: error.message });
  }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const taskId = req.params.id;
    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: 'Invalid task status' });
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    task.status = parseResult.data.status;
    await task.save();

    const populatedTask = await Task.findById(task._id).populate('ownerId', 'name email role');

    // Broadcast real-time task status update to active team members
    if (task.teamId) {
      broadcastTaskUpdated(task.teamId.toString(), populatedTask);
    }

    res.json({
      message: 'Task status updated',
      task: populatedTask,
    });
  } catch (error: any) {
    console.error('[TaskController] Update task status error:', error);
    res.status(500).json({ message: 'Server error updating task status', error: error.message });
  }
};

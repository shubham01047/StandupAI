import { Request, Response } from 'express';
import { z } from 'zod';
import { Standup } from '../models/Standup';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { extractTasksFromStandup } from '../services/aiService';
import { broadcastStandupCreatedOrUpdated } from '../services/socketService';

const createStandupSchema = z.object({
  did: z.string().min(3, 'Please describe what you accomplished'),
  doing: z.string().min(3, 'Please describe what you plan to do'),
  blockers: z.string().optional().default('None'),
  dateStr: z.string().optional(),
});

/**
 * Get current date string in YYYY-MM-DD format
 */
const getTodayDateStr = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Create or update daily standup entry and trigger AI task extraction
 */
export const createOrUpdateStandup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.teamId) {
      res.status(400).json({ message: 'You must belong to a team to submit daily standups' });
      return;
    }

    const parseResult = createStandupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { did, doing, blockers } = parseResult.data;
    const dateStr = parseResult.data.dateStr || getTodayDateStr();

    // Check if user already submitted a standup today
    let standup = await Standup.findOne({
      userId: user._id,
      dateStr,
    });

    if (standup) {
      // Update existing standup
      standup.did = did;
      standup.doing = doing;
      standup.blockers = blockers || 'None';
      await standup.save();
    } else {
      // Create new standup entry
      standup = new Standup({
        userId: user._id,
        teamId: user.teamId,
        did,
        doing,
        blockers: blockers || 'None',
        dateStr,
      });
      await standup.save();
    }

    // AI Task Extraction Pipeline
    try {
      const extractedTaskItems = await extractTasksFromStandup(did, doing, blockers || 'None');

      // Clear existing tasks for this standup if updating
      await Task.deleteMany({ standupId: standup._id });

      if (extractedTaskItems.length > 0) {
        const taskDocs = extractedTaskItems.map((item) => ({
          standupId: standup._id,
          teamId: user.teamId,
          ownerId: user._id,
          title: item.title,
          category: item.category,
          status: item.status,
          extractedByAI: true,
        }));
        await Task.insertMany(taskDocs);
      }
    } catch (aiError) {
      console.error('[StandupController] AI Task Extraction Error:', aiError);
    }

    const populatedStandup = await Standup.findById(standup._id).populate('userId', 'name email role');
    const standupTasks = await Task.find({ standupId: standup._id });

    const responseStandup = {
      ...populatedStandup?.toObject(),
      tasks: standupTasks,
    };

    // Broadcast real-time standup & tasks event to active team members
    if (user.teamId) {
      broadcastStandupCreatedOrUpdated(user.teamId.toString(), responseStandup);
    }

    res.status(201).json({
      message: 'Standup submitted successfully',
      standup: responseStandup,
    });
  } catch (error: any) {
    console.error('[StandupController] Create standup error:', error);
    res.status(500).json({ message: 'Server error submitting standup', error: error.message });
  }
};

/**
 * Get team standup feed for today or selected date along with AI extracted tasks
 */
export const getTeamStandups = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.teamId) {
      res.json({ standups: [] });
      return;
    }

    const queryDate = (req.query.date as string) || getTodayDateStr();

    const standups = await Standup.find({
      teamId: user.teamId,
      dateStr: queryDate,
    })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    // Fetch tasks linked to these standups
    const standupIds = standups.map((s) => s._id);
    const tasks = await Task.find({ standupId: { $in: standupIds } });

    // Map tasks to their respective standup documents
    const standupsWithTasks = standups.map((s) => {
      const sObj = s.toObject();
      const sTasks = tasks.filter((t) => t.standupId.toString() === s._id.toString());
      return {
        ...sObj,
        tasks: sTasks,
      };
    });

    res.json({
      dateStr: queryDate,
      standups: standupsWithTasks,
    });
  } catch (error: any) {
    console.error('[StandupController] Get team standups error:', error);
    res.status(500).json({ message: 'Server error fetching team standups', error: error.message });
  }
};

/**
 * Get standup submission history for current user
 */
export const getMyStandups = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const standups = await Standup.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ standups });
  } catch (error: any) {
    console.error('[StandupController] Get my standups error:', error);
    res.status(500).json({ message: 'Server error fetching standup history', error: error.message });
  }
};

import { Request, Response } from 'express';
import { z } from 'zod';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { generateUniqueInviteCode } from '../utils/inviteCode';
import { Types } from 'mongoose';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50, 'Team name too long'),
});

const joinTeamSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

/**
 * Create a new team
 */
export const createTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const parseResult = createTeamSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.teamId) {
      res.status(400).json({ message: 'You are already a member of a team. Please leave your current team first.' });
      return;
    }

    const inviteCode = await generateUniqueInviteCode();

    const team = new Team({
      name: parseResult.data.name,
      inviteCode,
      ownerId: user._id,
      members: [
        {
          userId: user._id,
          role: 'lead',
          joinedAt: new Date(),
        },
      ],
    });

    await team.save();

    // Link user to team
    user.teamId = team._id as Types.ObjectId;
    user.role = 'lead';
    await user.save();

    res.status(201).json({
      message: 'Team created successfully',
      team: {
        id: team._id,
        name: team.name,
        inviteCode: team.inviteCode,
        ownerId: team.ownerId,
        members: team.members,
        createdAt: team.createdAt,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        teamId: user.teamId,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[TeamController] Create team error:', error);
    res.status(500).json({ message: 'Server error creating team', error: error.message });
  }
};

/**
 * Join an existing team via invite code
 */
export const joinTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const parseResult = joinTeamSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: 'Invite code is required' });
      return;
    }

    const normalizedCode = parseResult.data.inviteCode.trim().toUpperCase();

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.teamId) {
      res.status(400).json({ message: 'You are already a member of a team. Please leave your current team first.' });
      return;
    }

    const team = await Team.findOne({ inviteCode: normalizedCode });
    if (!team) {
      res.status(404).json({ message: 'Invalid invite code. Team not found.' });
      return;
    }

    // Check if user is already in members array
    const isAlreadyMember = team.members.some(m => m.userId.toString() === user._id.toString());
    if (!isAlreadyMember) {
      team.members.push({
        userId: user._id as Types.ObjectId,
        role: 'member',
        joinedAt: new Date(),
      });
      await team.save();
    }

    user.teamId = team._id as Types.ObjectId;
    await user.save();

    res.json({
      message: `Joined team "${team.name}" successfully`,
      team: {
        id: team._id,
        name: team.name,
        inviteCode: team.inviteCode,
        ownerId: team.ownerId,
        members: team.members,
        createdAt: team.createdAt,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        teamId: user.teamId,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[TeamController] Join team error:', error);
    res.status(500).json({ message: 'Server error joining team', error: error.message });
  }
};

/**
 * Get current user's team details & member profiles
 */
export const getMyTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.teamId) {
      res.json({ team: null });
      return;
    }

    const team = await Team.findById(user.teamId).populate('members.userId', 'name email role');
    if (!team) {
      res.json({ team: null });
      return;
    }

    res.json({
      team: {
        id: team._id,
        name: team.name,
        inviteCode: team.inviteCode,
        ownerId: team.ownerId,
        members: team.members,
        createdAt: team.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[TeamController] GetMyTeam error:', error);
    res.status(500).json({ message: 'Server error fetching team details', error: error.message });
  }
};

/**
 * Leave current team
 */
export const leaveTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.teamId) {
      res.status(400).json({ message: 'You are not currently in any team' });
      return;
    }

    const team = await Team.findById(user.teamId);
    if (team) {
      // Remove user from team members list
      team.members = team.members.filter(m => m.userId.toString() !== user._id.toString());

      // If team is left empty, option to delete or reassign owner
      if (team.members.length === 0) {
        await Team.findByIdAndDelete(team._id);
      } else {
        if (team.ownerId.toString() === user._id.toString()) {
          team.ownerId = team.members[0].userId; // Reassign owner to first remaining member
        }
        await team.save();
      }
    }

    user.teamId = undefined;
    user.role = 'member';
    await user.save();

    res.json({
      message: 'Left team successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        teamId: null,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[TeamController] Leave team error:', error);
    res.status(500).json({ message: 'Server error leaving team', error: error.message });
  }
};

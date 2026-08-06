import { Schema, model, Document, Types } from 'mongoose';

export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';
export type TaskCategory = 'did' | 'doing' | 'blocker';

export interface ITask extends Document {
  _id: Types.ObjectId;
  standupId: Types.ObjectId;
  teamId: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  extractedByAI: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    standupId: {
      type: Schema.Types.ObjectId,
      ref: 'Standup',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['did', 'doing', 'blocker'],
      required: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'blocked', 'done'],
      default: 'todo',
    },
    extractedByAI: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast board queries grouped by team
TaskSchema.index({ teamId: 1, status: 1 });

export const Task = model<ITask>('Task', TaskSchema);

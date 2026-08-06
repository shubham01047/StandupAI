import { Schema, model, Document, Types } from 'mongoose';

export interface IStandup extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  teamId: Types.ObjectId;
  did: string;
  doing: string;
  blockers: string;
  dateStr: string; // YYYY-MM-DD format for easy daily queries
  createdAt: Date;
  updatedAt: Date;
}

const StandupSchema = new Schema<IStandup>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    did: {
      type: String,
      required: [true, 'Did section is required'],
      trim: true,
    },
    doing: {
      type: String,
      required: [true, 'Doing section is required'],
      trim: true,
    },
    blockers: {
      type: String,
      default: 'None',
      trim: true,
    },
    dateStr: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure fast queries per team and date
StandupSchema.index({ teamId: 1, dateStr: -1 });

export const Standup = model<IStandup>('Standup', StandupSchema);

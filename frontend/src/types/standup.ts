import { Task } from './task';

export interface StandupUser {
  _id: string;
  name: string;
  email: string;
  role: 'member' | 'lead';
}

export interface Standup {
  _id: string;
  userId: StandupUser | string;
  teamId: string;
  did: string;
  doing: string;
  blockers?: string;
  dateStr: string;
  tasks?: Task[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStandupPayload {
  did: string;
  doing: string;
  blockers?: string;
  dateStr?: string;
}

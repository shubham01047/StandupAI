export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';
export type TaskCategory = 'did' | 'doing' | 'blocker';

export interface TaskOwner {
  _id: string;
  name: string;
  email: string;
  role: 'member' | 'lead';
}

export interface Task {
  _id: string;
  standupId: string;
  teamId: string;
  ownerId: TaskOwner | string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  extractedByAI: boolean;
  createdAt: string;
  updatedAt: string;
}

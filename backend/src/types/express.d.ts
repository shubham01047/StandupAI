import { Types } from 'mongoose';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  teamId?: string | null;
  role: 'member' | 'lead';
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

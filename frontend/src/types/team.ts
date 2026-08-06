export interface TeamMember {
  userId: {
    _id: string;
    name: string;
    email: string;
    role: 'member' | 'lead';
  } | string;
  role: 'member' | 'lead';
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  members: TeamMember[];
  createdAt?: string;
}

export interface CreateTeamPayload {
  name: string;
}

export interface JoinTeamPayload {
  inviteCode: string;
}

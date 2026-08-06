export interface User {
  id: string;
  name: string;
  email: string;
  teamId?: string | null;
  role: 'member' | 'lead';
  createdAt?: string;
}

export interface AuthResponse {
  message?: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role?: 'member' | 'lead';
}

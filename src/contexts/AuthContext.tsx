import { createContext } from 'react';
import type { User } from '../types';

interface StravaUserData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    email?: string;
    firstname?: string;
    lastname?: string;
  };
  authenticated: boolean;
  auth_type: string;
  dbUser?: {
    id: string;
    email: string;
    name: string;
    strava_user_id: string;
    created_at: string;
    updated_at: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  stravaTokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
}

interface AuthContextType extends AuthState {
  login: (userData: StravaUserData) => Promise<void>;
  logout: () => void;
  isTokenExpired: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export type { AuthContextType, StravaUserData }; 
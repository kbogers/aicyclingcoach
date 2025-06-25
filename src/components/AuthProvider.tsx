import React, { createContext, useEffect, useState } from 'react';
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
  login: (userData: StravaUserData) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export type { AuthContextType };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    stravaTokens: null,
  });

  useEffect(() => {
    // Check for existing authentication on app load
    const checkAuth = () => {
      try {
        const stravaUser = localStorage.getItem('strava_user');
        if (stravaUser) {
          const userData = JSON.parse(stravaUser);
          if (userData.authenticated && userData.athlete) {
            setAuthState({
              user: {
                id: userData.athlete.id.toString(),
                email: userData.athlete.email || `strava_${userData.athlete.id}@temp.com`,
                name: `${userData.athlete.firstname || ''} ${userData.athlete.lastname || ''}`.trim(),
                strava_user_id: userData.athlete.id.toString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              isAuthenticated: true,
              isLoading: false,
              stravaTokens: {
                access_token: userData.access_token,
                refresh_token: userData.refresh_token,
                expires_at: userData.expires_at,
              },
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        localStorage.removeItem('strava_user');
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
    };

    checkAuth();
  }, []);

  const login = (userData: StravaUserData) => {
    const user: User = {
      id: userData.athlete.id.toString(),
      email: userData.athlete.email || `strava_${userData.athlete.id}@temp.com`,
      name: `${userData.athlete.firstname || ''} ${userData.athlete.lastname || ''}`.trim(),
      strava_user_id: userData.athlete.id.toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      stravaTokens: {
        access_token: userData.access_token,
        refresh_token: userData.refresh_token,
        expires_at: userData.expires_at,
      },
    });

    // Store in localStorage
    localStorage.setItem('strava_user', JSON.stringify({
      ...userData,
      authenticated: true,
      auth_type: 'strava',
    }));
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      stravaTokens: null,
    });
    localStorage.removeItem('strava_user');
  };

  const isTokenExpired = (): boolean => {
    if (!authState.stravaTokens) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= authState.stravaTokens.expires_at;
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    isTokenExpired,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

 
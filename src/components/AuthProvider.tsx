import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '../types';
import { AuthContext, type StravaUserData } from '../contexts/AuthContext';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    stravaTokens: null,
  });

  useEffect(() => {
    // Check for existing authentication on app load
    const checkAuth = async () => {
      try {
        const stravaUser = localStorage.getItem('strava_user');
        if (stravaUser) {
          const userData = JSON.parse(stravaUser);
          if (userData.authenticated && userData.athlete) {
            // If we have database user data stored, use it
            if (userData.dbUser) {
              setAuthState({
                user: {
                  id: userData.dbUser.id,
                  email: userData.dbUser.email,
                  name: userData.dbUser.name,
                  strava_user_id: userData.dbUser.strava_user_id,
                  created_at: userData.dbUser.created_at,
                  updated_at: userData.dbUser.updated_at,
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
            } else {
              // Fallback: fetch from database if not stored
              try {
                const { data: dbUser, error } = await supabase
                  .from('users')
                  .select('*')
                  .eq('strava_user_id', userData.athlete.id.toString())
                  .single();

                if (!error && dbUser) {
                  const updatedUserData = {
                    ...userData,
                    dbUser,
                  };
                  
                  localStorage.setItem('strava_user', JSON.stringify(updatedUserData));
                  
                  setAuthState({
                    user: {
                      id: dbUser.id,
                      email: dbUser.email,
                      name: dbUser.name,
                      strava_user_id: dbUser.strava_user_id,
                      created_at: dbUser.created_at,
                      updated_at: dbUser.updated_at,
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
              } catch (dbError) {
                console.error('Error fetching user from database:', dbError);
              }
            }
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

  const login = async (userData: StravaUserData) => {
    try {
      // Check if the Edge Function already returned the user data
      if (userData.dbUser) {
        const user: User = {
          id: userData.dbUser.id,
          email: userData.dbUser.email,
          name: userData.dbUser.name,
          strava_user_id: userData.dbUser.strava_user_id,
          created_at: userData.dbUser.created_at,
          updated_at: userData.dbUser.updated_at,
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
        return;
      }

      // Fallback: fetch from database if not included in response
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('strava_user_id', userData.athlete.id.toString())
        .single();

      if (error) {
        console.error('Error fetching user from database:', error);
        throw new Error('Failed to fetch user data');
      }

      const user: User = {
        id: dbUser.id, // This is the UUID from the database
        email: dbUser.email,
        name: dbUser.name,
        strava_user_id: dbUser.strava_user_id,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
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
        dbUser: user,
      }));
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('strava_user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      stravaTokens: null,
    });
  };

  const isTokenExpired = (): boolean => {
    if (!authState.stravaTokens) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= authState.stravaTokens.expires_at;
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isTokenExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

 
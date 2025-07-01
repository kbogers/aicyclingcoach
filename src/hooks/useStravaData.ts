import { useState, useEffect, useCallback } from 'react';
import { StravaApiService } from '../services/stravaApi';
import { DataService, type DatabaseActivity } from '../services/dataService';
import { useAuth } from './useAuth';
import type { StravaActivity } from '../types';

interface StravaDataState {
  activities: StravaActivity[];
  recentActivities: StravaActivity[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  lastFetch: Date | null;
  lastSync: string | null;
  rateLimited: boolean;
  lastSyncAttempt: Date | null;
}

interface UseStravaDataReturn extends StravaDataState {
  fetchActivities: (page?: number, perPage?: number) => Promise<void>;
  fetchRecentActivities: () => Promise<void>;
  fetchActivityById: (activityId: string) => Promise<StravaActivity | null>;
  syncWithStrava: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export function useStravaData(): UseStravaDataReturn {
  const { user, stravaTokens, isTokenExpired } = useAuth();
  const [state, setState] = useState<StravaDataState>({
    activities: [],
    recentActivities: [],
    loading: false,
    syncing: false,
    error: null,
    lastFetch: null,
    lastSync: null,
    rateLimited: false,
    lastSyncAttempt: null,
  });

  const stravaApi = stravaTokens?.access_token && !isTokenExpired() 
    ? new StravaApiService(stravaTokens.access_token)
    : null;

  const dataService = new DataService();

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load activities from database
  const loadActivitiesFromDatabase = useCallback(async () => {
    if (!user) return;

    try {
      const { data: recentData, error: recentError } = await dataService.getRecentActivities(user.id, 30);
      const { data: allData, error: allError } = await dataService.getActivities(user.id, 50);

      // If table doesn't exist, just return empty arrays (don't show error to user)
      if (recentError?.includes('does not exist') || allError?.includes('does not exist')) {
        console.log('Activities table does not exist yet. Please run the database migration.');
        setState(prev => ({
          ...prev,
          recentActivities: [],
          activities: [],
        }));
        return;
      }

      // Convert database activities to StravaActivity format
      const convertDbToStrava = (dbActivities: DatabaseActivity[]): StravaActivity[] => {
        return dbActivities.map(activity => {
          const streams = (activity as DatabaseActivity & { 
            activity_streams?: {
              time_in_power_zones?: any;
              time_in_hr_zones?: any;
              time_stream?: number[];
              watts_stream?: number[];
              heartrate_stream?: number[];
              distance_stream?: number[];
            }
          }).activity_streams;
          const powerZones = streams?.time_in_power_zones || null;
          const hrZones = streams?.time_in_hr_zones || null;
          
          return {
            id: activity.strava_activity_id,
            name: activity.name,
            type: activity.type,
            start_date: activity.start_date,
            moving_time: activity.moving_time,
            distance: activity.distance,
            total_elevation_gain: activity.total_elevation_gain,
            description: activity.description,
            private_note: activity.private_note,
            has_heartrate: activity.has_heartrate,
            has_power: activity.has_power,
            average_heartrate: activity.average_heartrate,
            max_heartrate: activity.max_heartrate,
            average_power: activity.average_power,
            max_power: activity.max_power,
            power_zones: powerZones,
            hr_zones: hrZones,
            activity_streams: streams ? {
              time_stream: streams.time_stream,
              watts_stream: streams.watts_stream,
              heartrate_stream: streams.heartrate_stream,
              distance_stream: streams.distance_stream,
            } : undefined,
          };
        });
      };

      setState(prev => ({
        ...prev,
        recentActivities: convertDbToStrava(recentData),
        activities: convertDbToStrava(allData),
      }));
    } catch (error) {
      console.error('Error loading activities from database:', error);
    }
  }, [user, dataService]);

  const syncWithStrava = useCallback(async () => {
    if (!stravaApi || !user) {
      setState(prev => ({ 
        ...prev, 
        error: 'Not authenticated or token expired. Please log in again.' 
      }));
      return;
    }

    // Check if we're rate limited and it's been less than 15 minutes
    const now = new Date();
    if (state.rateLimited && state.lastSyncAttempt) {
      const timeSinceLastAttempt = now.getTime() - state.lastSyncAttempt.getTime();
      if (timeSinceLastAttempt < 15 * 60 * 1000) { // 15 minutes
        console.log('Rate limited, waiting before next attempt');
        return;
      }
    }

    setState(prev => ({ 
      ...prev, 
      syncing: true, 
      error: null, 
      lastSyncAttempt: now,
      rateLimited: false 
    }));

    try {
      // Check if sync is needed
      const { shouldSync, lastSync } = await dataService.shouldSync(user.id);
      
      setState(prev => ({ ...prev, lastSync: lastSync || null }));

      if (!shouldSync) {
        console.log('Sync not needed, last sync was recent');
        setState(prev => ({ ...prev, syncing: false }));
        await loadActivitiesFromDatabase();
        return;
      }

      // Fetch recent activities from Strava
      const response = await stravaApi.getRecentCyclingActivities(30);
      
      if (response.error) {
        const isRateLimit = response.error.includes('Rate limit exceeded');
        setState(prev => ({ 
          ...prev, 
          syncing: false, 
          error: response.error || 'Failed to sync with Strava',
          rateLimited: isRateLimit
        }));
        return;
      }

      // Store activities in database
      const { success, error, stored, rows } = await dataService.storeActivities(user.id, response.data);

      if (!success) {
        // If table doesn't exist, show a helpful message
        if (error?.includes('does not exist')) {
          setState(prev => ({ 
            ...prev, 
            syncing: false, 
            error: 'Database not set up. Please run the database migration in Supabase.' 
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            syncing: false, 
            error: error || 'Failed to store activities' 
          }));
        }
        return;
      }

      // Fetch and store streams for the latest activities (max 10)
      if (success && rows && rows.length > 0) {
        const ftp = user.ftp ?? 250;
        const lthr = user.lthr ?? 170;
        await dataService.storeActivityStreams(rows, stravaApi, ftp, lthr).catch(console.error);
      }

      // Update last sync timestamp
      await dataService.updateLastSync(user.id);

      // Load updated data from database
      await loadActivitiesFromDatabase();

      setState(prev => ({
        ...prev,
        syncing: false,
        lastFetch: new Date(),
        lastSync: new Date().toISOString(),
        rateLimited: false,
      }));

      console.log(`Successfully synced ${stored} activities`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with Strava';
      const isRateLimit = errorMessage.includes('Rate limit exceeded');
      
      setState(prev => ({
        ...prev,
        syncing: false,
        error: errorMessage,
        rateLimited: isRateLimit,
      }));
    }
  }, [stravaApi, user, dataService, loadActivitiesFromDatabase, state.rateLimited, state.lastSyncAttempt]);

  const fetchActivities = useCallback(async (page = 1, perPage = 30) => {
    if (!stravaApi) {
      setState(prev => ({ 
        ...prev, 
        error: 'Not authenticated or token expired. Please log in again.' 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await stravaApi.getCyclingActivities(page, perPage);
      
      if (response.error) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: response.error || 'Failed to fetch activities' 
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        activities: page === 1 ? response.data : [...prev.activities, ...response.data],
        loading: false,
        lastFetch: new Date(),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch activities',
      }));
    }
  }, [stravaApi]);

  const fetchRecentActivities = useCallback(async () => {
    // For recent activities, prefer database over direct API call
    // and trigger sync in background if needed
    if (user) {
      await loadActivitiesFromDatabase();
      
      // Trigger background sync if needed
      if (stravaApi) {
        const { shouldSync } = await dataService.shouldSync(user.id);
        if (shouldSync) {
          // Don't await this - let it run in background
          syncWithStrava().catch(console.error);
        }
      }
    }
  }, [user, stravaApi, loadActivitiesFromDatabase, syncWithStrava, dataService]);

  const fetchActivityById = useCallback(async (activityId: string): Promise<StravaActivity | null> => {
    if (!stravaApi) {
      throw new Error('Not authenticated or token expired. Please log in again.');
    }

    const response = await stravaApi.getActivityById(activityId);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }, [stravaApi]);

  const refreshData = useCallback(async () => {
    await syncWithStrava();
  }, [syncWithStrava]);

  // Auto-load activities from database when component mounts
  useEffect(() => {
    if (user && state.recentActivities.length === 0 && !state.loading && !state.syncing) {
      loadActivitiesFromDatabase();
    }
  }, [user]); // Only depend on user to avoid infinite loops

  // Auto-sync if user is authenticated and hasn't synced recently
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (stravaApi && user && !state.syncing && !state.loading && !state.rateLimited) {
      // Add a delay to prevent immediate repeated calls
      timeoutId = setTimeout(() => {
        dataService.shouldSync(user.id).then(({ shouldSync }) => {
          if (shouldSync && !state.syncing && !state.rateLimited) {
            syncWithStrava();
          }
        }).catch(console.error);
      }, 2000); // Increased delay
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user]); // Only depend on user to avoid infinite loops

  return {
    ...state,
    fetchActivities,
    fetchRecentActivities,
    fetchActivityById,
    syncWithStrava,
    refreshData,
    clearError,
  };
} 
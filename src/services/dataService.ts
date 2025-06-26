import { supabase } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import type { StravaActivity } from '../types';
import { StravaApiService } from './stravaApi';
import { computeTimeInPowerZones, computeTimeInHrZones } from '../utils/trainingZones';

// Create a service client for server-side operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

let serviceClient: ReturnType<typeof createClient> | null = null;

// Only create service client if we have the service key
if (supabaseServiceKey) {
  serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: 'supabase-service' // unique key to avoid clashing with browser session
    }
  });
}

export interface DatabaseActivity {
  id: string;
  user_id: string;
  strava_activity_id: string;
  name: string;
  type: string;
  start_date: string;
  moving_time: number;
  distance: number;
  total_elevation_gain: number;
  description?: string;
  private_note?: string;
  has_heartrate: boolean;
  has_power: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  average_power?: number;
  max_power?: number;
  created_at: string;
  updated_at: string;
}

export class DataService {
  
  // Get the appropriate client - use service client if available, otherwise regular client
  private getClient() {
    return serviceClient || supabase;
  }
  
  /**
   * Store activities in the database, handling duplicates
   */
  async storeActivities(userId: string, activities: StravaActivity[]): Promise<{ success: boolean; error?: string; stored: number; rows?: { id: string; strava_activity_id: string }[] }> {
    try {
      const activitiesToStore = activities.map(activity => ({
        user_id: userId,
        strava_activity_id: activity.id,
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
        average_heartrate: activity.average_heartrate != null ? Math.round(activity.average_heartrate) : null,
        max_heartrate: activity.max_heartrate != null ? Math.round(activity.max_heartrate) : null,
        average_power: activity.average_power != null ? Math.round(activity.average_power) : null,
        max_power: activity.max_power != null ? Math.round(activity.max_power) : null,
      }));

      // Use service client for operations that need to bypass RLS
      const client = this.getClient();
      
      // Use upsert to handle duplicates based on user_id and strava_activity_id
      const { data, error } = await client
        .from('activities')
        .upsert(activitiesToStore, {
          onConflict: 'user_id,strava_activity_id',
          ignoreDuplicates: false
        })
        .select('id, strava_activity_id');

      if (error) {
        console.error('Error storing activities:', error);
        return { success: false, error: error.message, stored: 0 };
      }

      return { success: true, stored: data?.length || 0, rows: data as {id: string; strava_activity_id: string}[] };
    } catch (error) {
      console.error('Error in storeActivities:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stored: 0
      };
    }
  }

  /**
   * Get activities from database for a user
   */
  async getActivities(userId: string, limit = 50, offset = 0): Promise<{ data: DatabaseActivity[]; error?: string }> {
    try {
      const client = this.getClient();
      
      const { data, error } = await client
        .from('activities')
        .select('*, activity_streams(time_in_power_zones, time_in_hr_zones)')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching activities:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Error in getActivities:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recent activities from database
   */
  async getRecentActivities(userId: string, days = 30): Promise<{ data: DatabaseActivity[]; error?: string }> {
    try {
      const afterDate = new Date();
      afterDate.setDate(afterDate.getDate() - days);
      const afterDateISO = afterDate.toISOString();

      const client = this.getClient();

      const { data, error } = await client
        .from('activities')
        .select('*, activity_streams(time_in_power_zones, time_in_hr_zones)')
        .eq('user_id', userId)
        .gte('start_date', afterDateISO)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching recent activities:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Error in getRecentActivities:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get activity statistics for a user
   */
  async getActivityStats(userId: string, days = 30): Promise<{
    data: {
      totalActivities: number;
      totalDistance: number;
      totalTime: number;
      avgPower?: number;
      avgHeartRate?: number;
    };
    error?: string;
  }> {
    try {
      const afterDate = new Date();
      afterDate.setDate(afterDate.getDate() - days);
      const afterDateISO = afterDate.toISOString();

      const client = this.getClient();

      const { data, error } = await client
        .from('activities')
        .select('distance, moving_time, average_power, average_heartrate')
        .eq('user_id', userId)
        .gte('start_date', afterDateISO);

      if (error) {
        console.error('Error fetching activity stats:', error);
        return { 
          data: { totalActivities: 0, totalDistance: 0, totalTime: 0 }, 
          error: error.message 
        };
      }

      const activities = data || [];
      const totalActivities = activities.length;
      const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0);
      const totalTime = activities.reduce((sum, a) => sum + (a.moving_time || 0), 0);
      
      const activitiesWithPower = activities.filter(a => a.average_power);
      const avgPower = activitiesWithPower.length > 0 
        ? activitiesWithPower.reduce((sum, a) => sum + (a.average_power || 0), 0) / activitiesWithPower.length
        : undefined;

      const activitiesWithHR = activities.filter(a => a.average_heartrate);
      const avgHeartRate = activitiesWithHR.length > 0 
        ? activitiesWithHR.reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / activitiesWithHR.length
        : undefined;

      return {
        data: {
          totalActivities,
          totalDistance,
          totalTime,
          avgPower,
          avgHeartRate
        }
      };
    } catch (error) {
      console.error('Error in getActivityStats:', error);
      return { 
        data: { totalActivities: 0, totalDistance: 0, totalTime: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update last sync timestamp for a user
   */
  async updateLastSync(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();
      
      const { error } = await client
        .from('users')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating last sync:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateLastSync:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if user needs to sync (last sync was more than 1 hour ago)
   */
  async shouldSync(userId: string): Promise<{ shouldSync: boolean; lastSync?: string; error?: string }> {
    try {
      const client = this.getClient();
      
      const { data, error } = await client
        .from('users')
        .select('last_sync')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking sync status:', error);
        return { shouldSync: true, error: error.message };
      }

      if (!data.last_sync) {
        return { shouldSync: true };
      }

      const lastSync = new Date(data.last_sync);
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      return { 
        shouldSync: lastSync < oneHourAgo,
        lastSync: data.last_sync
      };
    } catch (error) {
      console.error('Error in shouldSync:', error);
      return { 
        shouldSync: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Store activity streams and calculated time-in-zone JSON
   */
  async storeActivityStreams(
    activityRows: { id: string; strava_activity_id: string }[] | undefined,
    stravaApi: StravaApiService,
    ftp: number,
    lthr: number,
    maxActivities = 10
  ): Promise<{ success: boolean; error?: string }> {
    if (!activityRows || activityRows.length === 0) return { success: true };

    const client = this.getClient();

    try {
      for (let i = 0; i < activityRows.length && i < maxActivities; i++) {
        const row = activityRows[i];

        // Fetch streams from Strava
        const streamResp = await stravaApi.getActivityStreams(row.strava_activity_id);
        if (streamResp.error) {
          console.warn('Failed to fetch streams for activity', row.strava_activity_id, streamResp.error);
          continue;
        }

        const streams = streamResp.data;

        const powerZones = streams.watts?.data && streams.watts.data.length > 0
          ? computeTimeInPowerZones(streams.watts.data, ftp)
          : null;

        const hrZones = (!powerZones || streams.watts?.data.length === 0) && streams.heartrate?.data && streams.heartrate.data.length > 0
          ? computeTimeInHrZones(streams.heartrate.data, lthr)
          : null;

        const insertObj: Record<string, unknown> = {
          activity_id: row.id,
          time_stream: streams.time?.data || null,
          watts_stream: streams.watts?.data || null,
          heartrate_stream: streams.heartrate?.data || null,
          distance_stream: streams.distance?.data || null,
          altitude_stream: streams.altitude?.data || null,
          time_in_power_zones: powerZones,
          time_in_hr_zones: hrZones,
        };

        await client.from('activity_streams').upsert(insertObj, { onConflict: 'activity_id', ignoreDuplicates: false });
      }

      return { success: true };
    } catch (error) {
      console.error('Error storing activity streams:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
} 
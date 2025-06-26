import type { StravaActivity } from '../types';

interface StravaApiResponse<T> {
  data: T;
  error?: string;
}

interface StravaActivityRaw {
  id: number;
  name: string;
  type: string;
  start_date: string;
  moving_time: number;
  distance: number;
  total_elevation_gain: number;
  description?: string;
  private_note?: string;
  has_heartrate: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  max_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  external_id?: string;
  upload_id?: number;
}

interface StravaActivityStream {
  time?: { data: number[] };
  heartrate?: { data: number[] };
  watts?: { data: number[] };
  distance?: { data: number[] };
  altitude?: { data: number[] };
}

export class StravaApiService {
  private baseUrl = 'https://www.strava.com/api/v3';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string): Promise<StravaApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - token may be expired');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        }
        throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Strava API request failed:', error);
      return {
        data: null as T,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getActivities(page = 1, perPage = 30): Promise<StravaApiResponse<StravaActivity[]>> {
    const endpoint = `/athlete/activities?page=${page}&per_page=${perPage}`;
    const response = await this.makeRequest<StravaActivityRaw[]>(endpoint);

    if (response.error) {
      return { data: [], error: response.error };
    }

    // Transform raw Strava data to our format
    const activities: StravaActivity[] = response.data.map(activity => ({
      id: activity.id.toString(),
      name: activity.name,
      type: activity.type,
      start_date: activity.start_date,
      moving_time: activity.moving_time,
      distance: activity.distance,
      total_elevation_gain: activity.total_elevation_gain,
      description: activity.description || undefined,
      private_note: activity.private_note || undefined,
      has_heartrate: activity.has_heartrate,
      has_power: !!activity.device_watts && !!activity.average_watts,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      average_power: activity.average_watts,
      max_power: activity.max_watts,
    }));

    return { data: activities };
  }

  async getActivityById(activityId: string): Promise<StravaApiResponse<StravaActivity>> {
    const endpoint = `/activities/${activityId}`;
    const response = await this.makeRequest<StravaActivityRaw>(endpoint);

    if (response.error) {
      return { data: null as unknown as StravaActivity, error: response.error };
    }

    const activity: StravaActivity = {
      id: response.data.id.toString(),
      name: response.data.name,
      type: response.data.type,
      start_date: response.data.start_date,
      moving_time: response.data.moving_time,
      distance: response.data.distance,
      total_elevation_gain: response.data.total_elevation_gain,
      description: response.data.description || undefined,
      private_note: response.data.private_note || undefined,
      has_heartrate: response.data.has_heartrate,
      has_power: !!response.data.device_watts && !!response.data.average_watts,
      average_heartrate: response.data.average_heartrate,
      max_heartrate: response.data.max_heartrate,
      average_power: response.data.average_watts,
      max_power: response.data.max_watts,
    };

    return { data: activity };
  }

  async getActivityStreams(
    activityId: string, 
    streamTypes: string[] = ['time', 'heartrate', 'watts', 'distance', 'altitude']
  ): Promise<StravaApiResponse<StravaActivityStream>> {
    const endpoint = `/activities/${activityId}/streams?keys=${streamTypes.join(',')}&key_by_type=true`;
    const response = await this.makeRequest<StravaActivityStream>(endpoint);

    if (response.error) {
      return { data: {} as StravaActivityStream, error: response.error };
    }

    return response;
  }

  async getCyclingActivities(page = 1, perPage = 30): Promise<StravaApiResponse<StravaActivity[]>> {
    // Get all activities first, then filter for cycling types
    const response = await this.getActivities(page, perPage);
    
    if (response.error) {
      return response;
    }

    // Filter for cycling-related activities
    const cyclingTypes = ['Ride', 'VirtualRide', 'EBikeRide'];
    const cyclingActivities = response.data.filter(activity => 
      cyclingTypes.includes(activity.type)
    );

    return { data: cyclingActivities };
  }

  async getRecentCyclingActivities(days = 30): Promise<StravaApiResponse<StravaActivity[]>> {
    const after = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    const endpoint = `/athlete/activities?after=${after}&per_page=100`;
    
    const response = await this.makeRequest<StravaActivityRaw[]>(endpoint);

    if (response.error) {
      return { data: [], error: response.error };
    }

    // Filter and transform cycling activities
    const cyclingTypes = ['Ride', 'VirtualRide', 'EBikeRide'];
    const activities: StravaActivity[] = response.data
      .filter(activity => cyclingTypes.includes(activity.type))
      .map(activity => ({
        id: activity.id.toString(),
        name: activity.name,
        type: activity.type,
        start_date: activity.start_date,
        moving_time: activity.moving_time,
        distance: activity.distance,
        total_elevation_gain: activity.total_elevation_gain,
        description: activity.description || undefined,
        private_note: activity.private_note || undefined,
        has_heartrate: activity.has_heartrate,
        has_power: !!activity.device_watts && !!activity.average_watts,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        average_power: activity.average_watts,
        max_power: activity.max_watts,
      }));

    return { data: activities };
  }
} 
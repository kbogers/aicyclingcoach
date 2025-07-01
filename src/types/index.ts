// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  strava_user_id?: string;
  google_user_id?: string;
  ftp?: number;
  lthr?: number;
  created_at: string;
  updated_at: string;
}

// Training and Activity Types
export interface ActivityStreams {
  time_stream?: number[];
  watts_stream?: number[];
  heartrate_stream?: number[];
  distance_stream?: number[];
}

export interface StravaActivity {
  id: string;
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
  power_zones?: ZoneDistribution | null;
  hr_zones?: ZoneDistribution | null;
  activity_streams?: ActivityStreams;
}

// Training Plan Types
export interface TrainingSession {
  id: string;
  date: string;
  type: 'endurance' | 'tempo' | 'threshold' | 'vo2max' | 'rest' | 'recovery';
  duration: number; // in minutes
  intensity: number; // 1-10 scale
  description: string;
  completed: boolean;
  completed_activity_id?: string;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  goal_event?: EventGoal;
  sessions: TrainingSession[];
  created_at: string;
  updated_at: string;
}

// Goal and Event Types
export interface EventGoal {
  id: string;
  user_id: string;
  description: string; // "What are you training for?"
  target_date: string; // "By when do you want to achieve this?"
  created_at: string;
  updated_at: string;
}

// Feedback Types
export interface CoachFeedback {
  id: string;
  user_id: string;
  activity_id: string;
  message: string;
  type: 'motivation' | 'technique' | 'warning' | 'congratulation';
  created_at: string;
}

export interface ZoneDistribution {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
  z6?: number;
  z7?: number;
} 
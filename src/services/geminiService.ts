import { supabase } from '../lib/supabaseClient';
import type { StravaActivity, EventGoal } from '../types';

interface TrainingAnalysisData {
  recentActivities: StravaActivity[];
  goals: EventGoal[];
  timeInZones: Record<string, number> | null;
  restDays: number;
  weeklyStats: {
    totalActivities?: number;
    totalDistance?: number;
    totalTime?: number;
    avgPower?: number;
    avgHeartRate?: number;
  };
  userProfile: {
    id: string;
    email: string;
    name?: string;
  };
}

interface GeminiFeedbackResponse {
  feedback: string;
  source: 'gemini' | 'fallback' | 'error';
  timestamp: string;
  error?: string;
}

export class GeminiService {
  
  /**
   * Generate weekly feedback using Gemini AI with fallback to heuristic analysis
   */
  async getWeeklyFeedback(trainingData: TrainingAnalysisData): Promise<GeminiFeedbackResponse> {
    try {
      // First try Gemini via Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-feedback', {
        body: { trainingData }
      });

      if (error) {
        console.error('Gemini Edge Function error:', error);
        return this.getFallbackFeedback(trainingData, `Edge Function error: ${error.message}`);
      }

      if (data && data.feedback && data.source === 'gemini') {
        return {
          feedback: data.feedback,
          source: 'gemini',
          timestamp: data.timestamp || new Date().toISOString()
        };
      }

      // If no valid response from Gemini, use fallback
      return this.getFallbackFeedback(trainingData, 'No valid response from Gemini');

    } catch (error) {
      console.error('Error calling Gemini service:', error);
      return this.getFallbackFeedback(trainingData, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Generate fallback feedback using heuristic analysis
   */
  private getFallbackFeedback(trainingData: TrainingAnalysisData, errorReason: string): GeminiFeedbackResponse {
    try {
      const feedback = this.generateHeuristicFeedback(trainingData);
      
      return {
        feedback: `${feedback}\n\n⚠️ Note: Using simplified analysis due to AI service limitations. For full personalized insights, please try again later.`,
        source: 'fallback',
        timestamp: new Date().toISOString(),
        error: errorReason
      };
    } catch (fallbackError) {
      return {
        feedback: `Unable to generate training analysis at this time. Please ensure you have recent activities synced and try again later.\n\n⚠️ AI coaching services are temporarily unavailable.`,
        source: 'error',
        timestamp: new Date().toISOString(),
        error: `Fallback failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate simple heuristic-based feedback as fallback
   */
  private generateHeuristicFeedback(data: TrainingAnalysisData): string {
    const { recentActivities, goals, weeklyStats, restDays } = data;

    if (!recentActivities || recentActivities.length === 0) {
      return "No recent training activities found. Start with some easy rides to build your base fitness, and sync your Strava account to track progress.";
    }

    const totalActivities = weeklyStats?.totalActivities || recentActivities.length;
    const totalDistance = (weeklyStats?.totalDistance || 0) / 1000;
    const totalTime = (weeklyStats?.totalTime || 0) / 3600;
    const avgRestDays = restDays / 7;

    let feedback = "";

    // Weekly summary
    if (totalActivities >= 3) {
      feedback += `Great consistency this week with ${totalActivities} training sessions! `;
    } else if (totalActivities >= 1) {
      feedback += `You've been active with ${totalActivities} session${totalActivities > 1 ? 's' : ''} this week. `;
    }

    if (totalDistance > 0) {
      feedback += `You covered ${totalDistance.toFixed(1)}km in ${totalTime.toFixed(1)} hours. `;
    }

    // Goal-oriented feedback
    if (goals && goals.length > 0) {
      const nextGoal = goals[0];
      const daysToGoal = Math.ceil((new Date(nextGoal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysToGoal > 0) {
        feedback += `With ${daysToGoal} days until your goal "${nextGoal.description}", `;
        
        if (totalActivities < 3) {
          feedback += "consider increasing training frequency. ";
        } else {
          feedback += "you're on a good training path. ";
        }
      }
    }

    // Recovery analysis
    if (avgRestDays < 1) {
      feedback += "You're training very frequently - make sure to include proper recovery days to avoid burnout. ";
    } else if (avgRestDays > 2.5) {
      feedback += "Consider increasing training frequency for better progression. ";
    } else {
      feedback += "Your training-to-rest ratio looks balanced. ";
    }

    // Training zones feedback (simplified)
    const hasZoneData = recentActivities.some(a => a.power_zones || a.hr_zones);
    if (hasZoneData) {
      feedback += "Continue focusing on zone-based training to build specific fitness adaptations.";
    } else {
      feedback += "Consider using a heart rate monitor or power meter for more targeted training.";
    }

    return feedback;
  }

  /**
   * Check if Gemini service is configured
   */
  isConfigured(): boolean {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
  }
} 
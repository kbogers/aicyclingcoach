import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useStravaData } from './useStravaData';
import { useGoals } from './useGoals';
import { GeminiService } from '../services/geminiService';
import { DataService } from '../services/dataService';

interface WeeklyFeedback {
  feedback: string;
  source: 'gemini' | 'fallback' | 'error';
  timestamp: string;
  error?: string;
}

interface UseWeeklyCoachFeedbackReturn {
  feedback: WeeklyFeedback | null;
  loading: boolean;
  error: string | null;
  refreshFeedback: () => Promise<void>;
  lastUpdated: Date | null;
  isGeminiConfigured: boolean;
  canRefresh: boolean;
  rateLimitInfo: {
    canRequest: boolean;
    reason?: string;
    nextAllowedTime?: Date;
  };
}

export function useWeeklyCoachFeedback(): UseWeeklyCoachFeedbackReturn {
  const { user } = useAuth();
  const { recentActivities } = useStravaData();
  const { goals } = useGoals();
  
  const [feedback, setFeedback] = useState<WeeklyFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    canRequest: boolean;
    reason?: string;
    nextAllowedTime?: Date;
  }>({ canRequest: true });

  const geminiService = new GeminiService();
  const dataService = new DataService();

  // Check rate limits
  const checkRateLimit = useCallback(async () => {
    if (!user) return;
    
    const result = await dataService.canRequestCoachFeedback(user.id);
    setRateLimitInfo({
      canRequest: result.canRequest,
      reason: result.reason,
      nextAllowedTime: result.nextAllowedTime
    });
  }, [user]);

  // Load cached feedback
  const loadCachedFeedback = useCallback(async () => {
    if (!user) return;

    try {
      const result = await dataService.getCachedCoachFeedback(user.id);
      if (result.data) {
        setFeedback({
          feedback: result.data.feedback_text,
          source: result.data.source as 'gemini' | 'fallback' | 'error',
          timestamp: result.data.created_at
        });
        setLastUpdated(new Date(result.data.created_at));
      }
    } catch (err) {
      console.error('Error loading cached feedback:', err);
    }
  }, [user]);

  const refreshFeedback = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    // Check rate limits first
    const rateLimitResult = await dataService.canRequestCoachFeedback(user.id);
    setRateLimitInfo({
      canRequest: rateLimitResult.canRequest,
      reason: rateLimitResult.reason,
      nextAllowedTime: rateLimitResult.nextAllowedTime
    });

    if (!rateLimitResult.canRequest) {
      setError(rateLimitResult.reason || 'Rate limit exceeded');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine the timeframe (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Filter activities to the last 7 days only
      const weekActivities = recentActivities.filter(a => new Date(a.start_date) >= weekAgo);

      // Get weekly stats
      const statsResult = await dataService.getActivityStats(user.id, 7);
      if (statsResult.error) {
        throw new Error(statsResult.error);
      }

      // Calculate rest days within the last week
      const daysWithActivity = new Set<string>();
      weekActivities.forEach(act => {
        daysWithActivity.add(new Date(act.start_date).toDateString());
      });

      const totalRestDays = Math.max(0, 7 - daysWithActivity.size);

      // Aggregate time in zones from recent activities
      const timeInZones: Record<string, number> = {
        z1: 0, z2: 0, z3: 0, z4: 0, z5: 0
      };

      weekActivities.forEach(activity => {
        const zones = activity.power_zones || activity.hr_zones;
        if (zones) {
          if (zones.z1) timeInZones.z1 += zones.z1;
          if (zones.z2) timeInZones.z2 += zones.z2;
          if (zones.z3) timeInZones.z3 += zones.z3;
          if (zones.z4) timeInZones.z4 += zones.z4;
          if (zones.z5) timeInZones.z5 += zones.z5;
        }
      });

      // Prepare training data for Gemini
      const trainingData = {
        recentActivities: weekActivities,
        goals: goals,
        timeInZones: Object.keys(timeInZones).some(k => timeInZones[k] > 0) ? timeInZones : null,
        restDays: totalRestDays,
        weeklyStats: statsResult.data,
        userProfile: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };

      // Get feedback from Gemini service
      const feedbackResult = await geminiService.getWeeklyFeedback(trainingData);
      
      // Store in database
      await dataService.storeCoachFeedback(
        user.id,
        feedbackResult.feedback,
        feedbackResult.source,
        trainingData
      );

      setFeedback(feedbackResult);
      setLastUpdated(new Date());

      // Update rate limit info after successful request
      await checkRateLimit();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate feedback';
      setError(errorMessage);
      console.error('Weekly feedback error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, recentActivities, goals, checkRateLimit]);

  // Load cached feedback and rate limit info on mount
  useEffect(() => {
    if (user) {
      loadCachedFeedback();
      checkRateLimit();
    }
  }, [user?.id, loadCachedFeedback, checkRateLimit]);

  return {
    feedback,
    loading,
    error,
    refreshFeedback,
    lastUpdated,
    isGeminiConfigured: geminiService.isConfigured(),
    canRefresh: rateLimitInfo.canRequest && !loading,
    rateLimitInfo
  };
} 
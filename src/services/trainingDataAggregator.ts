import { DataService, type DatabaseActivity } from './dataService';
import type { ZoneDistribution } from '../types';

export interface ActivityInsight {
  activityId: string;
  date: string;
  type: string;
  duration: number; // minutes
  distance: number; // km
  intensity: 'easy' | 'moderate' | 'hard' | 'very_hard';
  zones: ZoneDistribution | null;
  noteKeywords: string[];
  noteSentiment: 'positive' | 'neutral' | 'negative' | null;
  trainingLoad: number; // 0-100 scale
}

export interface TrainingPattern {
  recentLoad: number; // average training load last 7 days
  loadTrend: 'increasing' | 'stable' | 'decreasing';
  recoveryNeeded: boolean;
  consistencyScore: number; // 0-100, based on regular training
  zoneFocus: 'endurance' | 'tempo' | 'threshold' | 'vo2max' | 'mixed';
  lastRestDay: number; // days ago
}

export interface TrainingAnalysis {
  activities: ActivityInsight[];
  patterns: TrainingPattern;
  recommendations: string[];
  fitness: number; // 0-100 estimated fitness level
  fatigue: number; // 0-100 estimated fatigue level
  form: number; // fitness - fatigue (-100 to +100)
}

export class TrainingDataAggregator {
  private dataService = new DataService();

  /**
   * Generate comprehensive training analysis for AI coaching
   */
  async analyzeRecentTraining(
    userId: string, 
    ftp: number, 
    lthr: number,
    daysBack = 14
  ): Promise<TrainingAnalysis> {
    try {
      // Get recent activities with streams
      const { data: activities, error } = await this.dataService.getRecentActivities(userId, daysBack);
      
      if (error) {
        throw new Error(`Failed to fetch activities: ${error}`);
      }

      // Process each activity
      const insights = activities.map(activity => this.processActivity(activity, ftp, lthr));

      // Analyze patterns
      const patterns = this.analyzePatterns(insights);

      // Calculate fitness metrics
      const { fitness, fatigue, form } = this.calculateFitnessMetrics(insights);

      // Generate recommendations
      const recommendations = this.generateRecommendations(patterns, fitness, fatigue, form);

      return {
        activities: insights,
        patterns,
        recommendations,
        fitness,
        fatigue,
        form
      };

    } catch (error) {
      console.error('Error analyzing training data:', error);
      throw error;
    }
  }

  /**
   * Process individual activity for insights
   */
  private processActivity(activity: DatabaseActivity, ftp: number, lthr: number): ActivityInsight {
    // Get zones from activity_streams (if available)
    const activityWithStreams = activity as DatabaseActivity & {
      activity_streams?: { time_in_power_zones?: ZoneDistribution; time_in_hr_zones?: ZoneDistribution };
    };
    const powerZones = activityWithStreams.activity_streams?.time_in_power_zones;
    const hrZones = activityWithStreams.activity_streams?.time_in_hr_zones;
    const zones = powerZones || hrZones || null;

    // Calculate intensity based on zones or average values
    const intensity = this.calculateIntensity(activity, zones, ftp, lthr);

    // Process private notes
    const { keywords, sentiment } = this.processPrivateNote(activity.private_note);

    // Calculate training load
    const trainingLoad = this.calculateTrainingLoad(activity, zones, intensity);

    return {
      activityId: activity.id,
      date: activity.start_date,
      type: activity.type,
      duration: Math.round(activity.moving_time / 60), // convert to minutes
      distance: Math.round(activity.distance / 1000 * 10) / 10, // convert to km, 1 decimal
      intensity,
      zones,
      noteKeywords: keywords,
      noteSentiment: sentiment,
      trainingLoad
    };
  }

  /**
   * Calculate activity intensity based on zones or averages
   */
  private calculateIntensity(
    activity: DatabaseActivity, 
    zones: ZoneDistribution | null, 
    ftp: number, 
    lthr: number
  ): 'easy' | 'moderate' | 'hard' | 'very_hard' {
    if (zones) {
      // Use zone distribution for intensity
      const totalTime = Object.values(zones).reduce((sum, time) => sum + (time || 0), 0);
      if (totalTime === 0) return 'easy';

      const highIntensity = (zones.z4 || 0) + (zones.z5 || 0) + (zones.z6 || 0) + (zones.z7 || 0);
      const moderateIntensity = (zones.z3 || 0);
      
      const highPct = highIntensity / totalTime;
      const moderatePct = moderateIntensity / totalTime;

      if (highPct > 0.15) return 'very_hard';
      if (highPct > 0.05 || moderatePct > 0.3) return 'hard';
      if (moderatePct > 0.1) return 'moderate';
      return 'easy';
    }

    // Fallback to average power/HR
    if (activity.average_power && ftp > 0) {
      const intensity = activity.average_power / ftp;
      if (intensity > 0.95) return 'very_hard';
      if (intensity > 0.75) return 'hard';
      if (intensity > 0.55) return 'moderate';
      return 'easy';
    }

    if (activity.average_heartrate && lthr > 0) {
      const intensity = activity.average_heartrate / lthr;
      if (intensity > 1.0) return 'very_hard';
      if (intensity > 0.85) return 'hard';
      if (intensity > 0.7) return 'moderate';
      return 'easy';
    }

    // Default based on duration (rough estimate)
    const durationHours = activity.moving_time / 3600;
    if (durationHours < 0.5) return 'easy';
    if (durationHours < 1.5) return 'moderate';
    if (durationHours < 2.5) return 'hard';
    return 'very_hard';
  }

  /**
   * Process private notes for keywords and sentiment
   */
  private processPrivateNote(note?: string): { keywords: string[]; sentiment: 'positive' | 'neutral' | 'negative' | null } {
    if (!note) return { keywords: [], sentiment: null };

    const lowerNote = note.toLowerCase();
    
    // Simple keyword extraction
    const keywords: string[] = [];
    const keywordPatterns = {
      feeling: /\b(tired|exhausted|fresh|strong|weak|good|great|bad|awful|amazing)\b/g,
      body: /\b(legs|heart|breathing|pain|sore|stiff|tight|loose)\b/g,
      weather: /\b(hot|cold|windy|rain|sunny|humid|dry)\b/g,
      equipment: /\b(bike|wheel|tire|chain|brake|gear)\b/g,
      effort: /\b(easy|hard|tough|struggle|smooth|fast|slow)\b/g
    };

    Object.entries(keywordPatterns).forEach(([, pattern]) => {
      const matches = lowerNote.match(pattern);
      if (matches) {
        keywords.push(...matches);
      }
    });

    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'amazing', 'strong', 'fresh', 'smooth', 'fast', 'easy'];
    const negativeWords = ['bad', 'awful', 'tired', 'exhausted', 'weak', 'pain', 'sore', 'struggle', 'tough'];
    
    const positiveCount = positiveWords.filter(word => lowerNote.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerNote.includes(word)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' | null = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    return { keywords: [...new Set(keywords)], sentiment };
  }

  /**
   * Calculate training load score (0-100)
   */
  private calculateTrainingLoad(
    activity: DatabaseActivity, 
    zones: ZoneDistribution | null, 
    intensity: string
  ): number {
    const durationHours = activity.moving_time / 3600;
    
    // Base load from duration
    let load = durationHours * 20; // 1 hour = 20 base points

    // Intensity multiplier
    const intensityMultiplier = {
      'easy': 1.0,
      'moderate': 1.5,
      'hard': 2.0,
      'very_hard': 2.5
    };

    load *= intensityMultiplier[intensity as keyof typeof intensityMultiplier];

    // Zone-based adjustment if available
    if (zones) {
      const totalTime = Object.values(zones).reduce((sum, time) => sum + (time || 0), 0);
      if (totalTime > 0) {
        const zoneWeights = { z1: 1, z2: 2, z3: 3, z4: 4, z5: 5, z6: 6, z7: 7 };
        const weightedTime = Object.entries(zones).reduce((sum, [zone, time]) => {
          const weight = zoneWeights[zone as keyof typeof zoneWeights] || 1;
          return sum + (time || 0) * weight;
        }, 0);
        
        const avgZone = weightedTime / totalTime;
        load = (load * 0.7) + (avgZone * durationHours * 10); // Blend approaches
      }
    }

    return Math.min(Math.round(load), 100); // Cap at 100
  }

  /**
   * Analyze training patterns
   */
  private analyzePatterns(insights: ActivityInsight[]): TrainingPattern {
    const sortedInsights = insights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Recent load (last 7 days)
    const last7Days = sortedInsights.filter(activity => {
      const activityDate = new Date(activity.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate >= weekAgo;
    });

    const recentLoad = last7Days.reduce((sum, activity) => sum + activity.trainingLoad, 0) / 7;

    // Load trend
    const next7Days = sortedInsights.filter(activity => {
      const activityDate = new Date(activity.date);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate >= twoWeeksAgo && activityDate < weekAgo;
    });

    const prevLoad = next7Days.reduce((sum, activity) => sum + activity.trainingLoad, 0) / 7;
    
    let loadTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentLoad > prevLoad * 1.15) loadTrend = 'increasing';
    else if (recentLoad < prevLoad * 0.85) loadTrend = 'decreasing';

    // Recovery assessment
    const highIntensityDays = last7Days.filter(a => a.intensity === 'hard' || a.intensity === 'very_hard').length;
    const recoveryNeeded = highIntensityDays >= 3 || recentLoad > 50;

    // Consistency score
    const expectedDays = Math.min(insights.length, 14);
    const actualDays = insights.length;
    const consistencyScore = Math.round((actualDays / expectedDays) * 100);

    // Zone focus
    const zoneTotals = insights.reduce((totals, activity) => {
      if (activity.zones) {
        Object.entries(activity.zones).forEach(([zone, time]) => {
          if (time) totals[zone] = (totals[zone] || 0) + time;
        });
      }
      return totals;
    }, {} as Record<string, number>);

    let zoneFocus: 'endurance' | 'tempo' | 'threshold' | 'vo2max' | 'mixed' = 'mixed';
    const totalZoneTime = Object.values(zoneTotals).reduce((sum, time) => sum + time, 0);
    
    if (totalZoneTime > 0) {
      const z1z2Pct = ((zoneTotals.z1 || 0) + (zoneTotals.z2 || 0)) / totalZoneTime;
      const z3Pct = (zoneTotals.z3 || 0) / totalZoneTime;
      const z4Pct = (zoneTotals.z4 || 0) / totalZoneTime;
      const z5z6z7Pct = ((zoneTotals.z5 || 0) + (zoneTotals.z6 || 0) + (zoneTotals.z7 || 0)) / totalZoneTime;

      if (z1z2Pct > 0.8) zoneFocus = 'endurance';
      else if (z3Pct > 0.3) zoneFocus = 'tempo';
      else if (z4Pct > 0.2) zoneFocus = 'threshold';
      else if (z5z6z7Pct > 0.1) zoneFocus = 'vo2max';
    }

    // Last rest day
    let lastRestDay = 0;
    for (let i = 0; i < sortedInsights.length; i++) {
      const activity = sortedInsights[i];
      const activityDate = new Date(activity.date);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (i === 0) {
        lastRestDay = daysDiff + 1; // Days since last activity + 1
        break;
      }
      
      // Look for gaps between activities
      const prevActivity = sortedInsights[i - 1];
      const prevDate = new Date(prevActivity.date);
      const gapDays = Math.floor((prevDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (gapDays > 1) {
        lastRestDay = Math.floor((today.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)) - gapDays + 1;
        break;
      }
    }

    return {
      recentLoad,
      loadTrend,
      recoveryNeeded,
      consistencyScore,
      zoneFocus,
      lastRestDay
    };
  }

  /**
   * Calculate fitness metrics using simplified TSS/CTL model
   */
  private calculateFitnessMetrics(insights: ActivityInsight[]): { fitness: number; fatigue: number; form: number } {
    // Simplified fitness model based on training load
    const sortedInsights = insights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let fitness = 0; // Chronic Training Load (CTL) - long term fitness
    let fatigue = 0; // Acute Training Load (ATL) - short term fatigue
    
    const fitnessDecay = 0.993; // Daily decay for fitness (42-day time constant)
    const fatigueDecay = 0.928; // Daily decay for fatigue (7-day time constant)
    
    // Process each day
    for (let i = 0; i < sortedInsights.length; i++) {
      const activity = sortedInsights[i];
      const load = activity.trainingLoad;
      
      // Apply decay
      fitness = fitness * fitnessDecay + load * (1 - fitnessDecay);
      fatigue = fatigue * fatigueDecay + load * (1 - fatigueDecay);
    }
    
    // Scale to 0-100
    fitness = Math.min(Math.round(fitness), 100);
    fatigue = Math.min(Math.round(fatigue), 100);
    
    const form = Math.round(fitness - fatigue);
    
    return { fitness, fatigue, form };
  }

  /**
   * Generate training recommendations
   */
  private generateRecommendations(
    patterns: TrainingPattern, 
    fitness: number, 
    fatigue: number, 
    form: number
  ): string[] {
    const recommendations: string[] = [];

    // Recovery recommendations
    if (patterns.recoveryNeeded || fatigue > 70) {
      recommendations.push("Consider an easy recovery ride or rest day to manage fatigue");
    }

    // Form recommendations
    if (form < -20) {
      recommendations.push("You're carrying significant fatigue. Focus on recovery and easy rides");
    } else if (form > 20) {
      recommendations.push("Good form! This could be a good time for harder training or events");
    }

    // Load trend recommendations
    if (patterns.loadTrend === 'increasing' && patterns.recentLoad > 40) {
      recommendations.push("Training load is increasing rapidly. Be mindful of recovery");
    } else if (patterns.loadTrend === 'decreasing' && fitness < 50) {
      recommendations.push("Training load has decreased. Consider adding more consistent rides");
    }

    // Zone focus recommendations
    if (patterns.zoneFocus === 'endurance') {
      recommendations.push("Good endurance base! Consider adding some tempo or threshold work");
    } else if (patterns.zoneFocus === 'vo2max') {
      recommendations.push("High intensity focus detected. Balance with more easy endurance rides");
    }

    // Consistency recommendations
    if (patterns.consistencyScore < 50) {
      recommendations.push("Try to maintain more consistent training to build fitness effectively");
    }

    // Rest day recommendations
    if (patterns.lastRestDay > 7) {
      recommendations.push("Consider taking a rest day - you haven't had one in over a week");
    }

    return recommendations.length > 0 ? recommendations : ["Keep up the great training! Stay consistent and listen to your body"];
  }
} 
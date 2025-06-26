import { TrainingDataAggregator } from '../services/trainingDataAggregator';
import type { TrainingPlan, TrainingSession, User } from '../types';

interface GeneratePlanParams {
  user: User;
  weeks: 4 | 8 | 12;
  startDate?: Date; // default today
}

/**
 * Generate high-level polarized training plan
 */
export async function generatePolarizedPlan({ user, weeks, startDate = new Date() }: GeneratePlanParams): Promise<TrainingPlan> {
  const aggregator = new TrainingDataAggregator();
  const ftp = user.ftp ?? 250;
  const lthr = user.lthr ?? 170;

  // Use recent training data to decide consistency
  let sessionsPerWeek = 3;
  try {
    const analysis = await aggregator.analyzeRecentTraining(user.id, ftp, lthr, 14);
    const score = analysis.patterns.consistencyScore;
    if (score >= 80) sessionsPerWeek = 5;
    else if (score >= 60) sessionsPerWeek = 4;
  } catch (err) {
    console.warn('Could not analyse recent training', err);
    console.warn('Defaulting to 3 sessions/week');
  }

  const totalSessions = sessionsPerWeek * weeks;
  const sessions: TrainingSession[] = [];

  // Helper to add days
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  // Distribution: 80% endurance, 20% high intensity (VO2 or Threshold)
  const highIntensityCount = Math.round(totalSessions * 0.2);

  // Build list of dates spaced over weeks
  const dayIndexes: number[] = [];
  const interval = Math.floor(7 / sessionsPerWeek); // roughly spread within a week
  for (let w = 0; w < weeks; w++) {
    for (let s = 0; s < sessionsPerWeek; s++) {
      dayIndexes.push(w * 7 + s * interval);
    }
  }

  // Shuffle high intensity positions (every 4th session roughly)
  const hiIndexes = new Set<number>();
  let hiPlaced = 0;
  for (let i = 0; i < dayIndexes.length && hiPlaced < highIntensityCount; i += 4) {
    hiIndexes.add(i);
    hiPlaced++;
  }

  dayIndexes.forEach((offset, idx) => {
    const dateISO = addDays(startDate, offset).toISOString();
    const isHigh = hiIndexes.has(idx);

    sessions.push({
      id: crypto.randomUUID(),
      date: dateISO,
      type: isHigh ? 'vo2max' : 'endurance',
      duration: isHigh ? 60 : 90, // minutes
      intensity: isHigh ? 9 : 3, // arbitrary 1-10 scale
      description: isHigh ? 'VO₂max intervals (e.g., 5×3′ Z5)' : 'Endurance ride Z1-Z2',
      completed: false,
    });
  });

  const plan: TrainingPlan = {
    id: crypto.randomUUID(),
    user_id: user.id,
    sessions,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return plan;
} 
import type { TrainingPlan, TrainingSession } from '../types';
import type { TrainingAnalysis } from '../services/trainingDataAggregator';

interface AdaptParams {
  plan: TrainingPlan;
  analysis: TrainingAnalysis;
}

/**
 * Adapt upcoming sessions in the plan based on the latest training analysis.
 * Heuristics:
 *  - If fatigue > 70 or recoveryNeeded: next hard session becomes endurance or rest.
 *  - If form > 20 and next session is endurance: upgrade to VO2 session.
 *  - Ensure at least 1 rest/easy day every 7 days.
 */
export function adaptTrainingPlan({ plan, analysis }: AdaptParams): TrainingPlan {
  const updated = { ...plan };
  const today = new Date();

  // Only look at sessions from today onward
  const upcoming = updated.sessions.filter(s => new Date(s.date) >= today && !s.completed);

  if (upcoming.length === 0) return updated;

  const { fatigue, form, patterns } = analysis;

  // Helper to downgrade to endurance
  const makeEndurance = (session: TrainingSession) => {
    session.type = 'endurance';
    session.intensity = 3;
    session.duration = 90;
    session.description = 'Endurance ride Z1-Z2 (adapted)';
  };

  // Helper to upgrade to VO2
  const makeVO2 = (session: TrainingSession) => {
    session.type = 'vo2max';
    session.intensity = 9;
    session.duration = 60;
    session.description = 'VO₂max intervals (adapted)';
  };

  // 1️⃣ High fatigue / recovery needed: soften the next hard session
  if (fatigue > 70 || patterns.recoveryNeeded) {
    const nextHard = upcoming.find(s => s.type === 'vo2max' || s.type === 'threshold');
    if (nextHard) makeEndurance(nextHard);
  }

  // 2️⃣ Good form: add intensity if next session is easy
  if (form > 20) {
    const nextEasy = upcoming.find(s => s.type === 'endurance');
    if (nextEasy) makeVO2(nextEasy);
  }

  // 3️⃣ Ensure at least one easy/rest day every 7 days
  ensureWeeklyRest(updated.sessions);

  updated.updated_at = new Date().toISOString();
  return updated;
}

function ensureWeeklyRest(sessions: TrainingSession[]) {
  // Group by week starting Monday
  const weeks = new Map<number, TrainingSession[]>();
  sessions.forEach(s => {
    const d = new Date(s.date);
    const weekNum = getISOWeekNumber(d);
    if (!weeks.has(weekNum)) weeks.set(weekNum, []);
    weeks.get(weekNum)!.push(s);
  });

  weeks.forEach(weekSessions => {
    const hasRest = weekSessions.some(s => s.type === 'rest');
    if (!hasRest) {
      // Insert a rest day between two sessions
      const insertAfter = weekSessions[0];
      const restDate = new Date(insertAfter.date);
      restDate.setDate(restDate.getDate() + 1);
      const restSession: TrainingSession = {
        id: crypto.randomUUID(),
        date: restDate.toISOString(),
        type: 'rest',
        duration: 0,
        intensity: 1,
        description: 'Rest day (auto-inserted)',
        completed: false,
      } as TrainingSession;
      sessions.push(restSession);
    }
  });
}

function getISOWeekNumber(date: Date): number {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return (
    1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
} 
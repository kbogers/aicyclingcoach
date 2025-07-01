import { useMemo } from 'react';
import type { TrainingSession } from '../types';

export function usePlannedSessions(): TrainingSession[] {
  return useMemo(() => {
    const sessions: TrainingSession[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Generate training sessions for the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Training pattern: 3-4 sessions per week
    const sessionDescriptions = {
      endurance: 'Long steady ride in Zone 1-2',
      tempo: 'Tempo intervals - 3x10min at Zone 3',
      threshold: 'Threshold work - 2x20min at Zone 4',
      vo2max: 'VO₂max intervals - 5x3min at Zone 5',
      recovery: 'Easy recovery spin - Zone 1'
    };
    
    // Create sessions for specific days of the week (Tuesday, Thursday, Saturday, Sunday)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Schedule training on Tuesday (2), Thursday (4), Saturday (6), Sunday (0)
      if ([0, 2, 4, 6].includes(dayOfWeek)) {
        let sessionType: 'endurance' | 'tempo' | 'threshold' | 'vo2max' | 'recovery';
        let duration: number;
        let intensity: number;
        
        // Pattern for training types
        if (dayOfWeek === 0) { // Sunday - long endurance
          sessionType = 'endurance';
          duration = 120; // 2 hours
          intensity = 3;
        } else if (dayOfWeek === 2) { // Tuesday - intensity
          sessionType = day % 14 < 7 ? 'vo2max' : 'threshold';
          duration = 60;
          intensity = sessionType === 'vo2max' ? 9 : 7;
        } else if (dayOfWeek === 4) { // Thursday - tempo or recovery
          sessionType = day % 10 < 5 ? 'tempo' : 'recovery';
          duration = sessionType === 'tempo' ? 75 : 45;
          intensity = sessionType === 'tempo' ? 5 : 2;
        } else { // Saturday - varied
          sessionType = day % 8 < 4 ? 'endurance' : 'tempo';
          duration = 90;
          intensity = sessionType === 'endurance' ? 3 : 5;
        }
        
        sessions.push({
          id: `planned-${currentYear}-${currentMonth}-${day}`,
          date: date.toISOString(),
          type: sessionType,
          duration,
          intensity,
          description: sessionDescriptions[sessionType as keyof typeof sessionDescriptions],
          completed: false,
        });
      }
    }
    
    return sessions;
  }, []);
} 
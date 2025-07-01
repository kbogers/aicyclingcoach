import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { DataService } from '../services/dataService';
import type { EventGoal } from '../types';

const dataService = new DataService();

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<EventGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const result = await dataService.getUserGoals(user.id);
    
    if (result.error) {
      setError(result.error);
    } else {
      setGoals(result.data);
      setError(null);
    }
    setLoading(false);
  };

  const addGoal = async (description: string, targetDate: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    const result = await dataService.upsertGoal(user.id, {
      description,
      target_date: targetDate
    });

    if (result.success && result.data) {
      setGoals(prev => [...prev, result.data!]);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const updateGoal = async (goalId: string, description: string, targetDate: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    const result = await dataService.upsertGoal(user.id, {
      id: goalId,
      description,
      target_date: targetDate
    });

    if (result.success && result.data) {
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? result.data! : goal
      ));
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const deleteGoal = async (goalId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    const result = await dataService.deleteGoal(user.id, goalId);

    if (result.success) {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const hasGoals = goals.length > 0;

  useEffect(() => {
    fetchGoals();
  }, [user?.id]);

  return {
    goals,
    loading,
    error,
    hasGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    refreshGoals: fetchGoals
  };
} 
import { useState, useEffect, useCallback } from 'react';
import { TrainingDataAggregator, type TrainingAnalysis } from '../services/trainingDataAggregator';
import { useAuth } from './useAuth';

interface UseTrainingAnalysisReturn {
  analysis: TrainingAnalysis | null;
  loading: boolean;
  error: string | null;
  refreshAnalysis: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useTrainingAnalysis(daysBack = 14): UseTrainingAnalysisReturn {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<TrainingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const aggregator = new TrainingDataAggregator();

  const refreshAnalysis = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ftp = user.ftp ?? 250;
      const lthr = user.lthr ?? 170;
      
      const result = await aggregator.analyzeRecentTraining(user.id, ftp, lthr, daysBack);
      
      setAnalysis(result);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze training data';
      setError(errorMessage);
      console.error('Training analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, daysBack, aggregator]);

  // Auto-refresh when user changes or component mounts
  useEffect(() => {
    if (user && !analysis && !loading) {
      refreshAnalysis();
    }
  }, [user, analysis, loading, refreshAnalysis]);

  return {
    analysis,
    loading,
    error,
    refreshAnalysis,
    lastUpdated
  };
} 
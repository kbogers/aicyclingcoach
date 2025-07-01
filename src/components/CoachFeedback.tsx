import { useTrainingAnalysis } from '../hooks/useTrainingAnalysis';
import type { CSSProperties } from 'react';

interface CoachFeedbackProps {
  /** Look back in days when generating feedback (default 14) */
  daysBack?: number;
}

export function CoachFeedback({ daysBack = 14 }: CoachFeedbackProps) {
  const { analysis, loading, error, refreshAnalysis, lastUpdated } = useTrainingAnalysis(daysBack);

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const feedbackItemStyle: CSSProperties = {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#1e3a8a',
  };

  if (loading && !analysis) {
    return (
      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
        Loading feedback…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#dc2626', fontSize: '14px' }}>
        Error: {error}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={{ color: '#6b7280', fontSize: '14px' }}>
        No feedback available yet.
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {analysis.recommendations.map((rec, idx) => (
        <div key={idx} style={feedbackItemStyle}>
          {rec}
        </div>
      ))}
      <button
        onClick={refreshAnalysis}
        style={{
          alignSelf: 'flex-start',
          padding: '6px 12px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: '#2563eb',
          color: 'white',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        Refresh Feedback
      </button>
      {lastUpdated && (
        <span style={{ color: '#6b7280', fontSize: '12px' }}>
          Last updated: {lastUpdated.toLocaleString()}
        </span>
      )}
    </div>
  );
} 
import { useWeeklyCoachFeedback } from '../hooks/useWeeklyCoachFeedback';
import { MaterialIcon } from './MaterialIcon';

export function CoachFeedback() {
  const { feedback, loading, error, refreshFeedback, lastUpdated, isGeminiConfigured } = useWeeklyCoachFeedback();

  if (loading && !feedback) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '3rem',
        color: '#6b7280',
        gap: '0.5rem'
      }}>
        <MaterialIcon name="psychology" size={20} style={{ color: '#3b82f6' }} />
        <span>Analyzing your training...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '1.5rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <MaterialIcon name="error" size={18} style={{ color: '#dc2626' }} />
          <strong>Unable to generate feedback</strong>
        </div>
        <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div style={{ 
        padding: '3rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <MaterialIcon name="fitness_center" size={32} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Ready to analyze your training</h3>
        <p style={{ margin: '0 0 1.5rem 0', fontSize: '14px' }}>
          Complete some training sessions and sync your Strava data to receive personalized coaching insights.
        </p>
        <button
          onClick={refreshFeedback}
          style={{
            padding: '8px 16px',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0 auto'
          }}
        >
          <MaterialIcon name="refresh" size={16} />
          Generate Feedback
        </button>
      </div>
    );
  }

  // Source indicator styling
  const getSourceIndicator = () => {
    switch (feedback.source) {
      case 'gemini':
        return {
          icon: 'auto_awesome',
          color: '#059669',
          bgColor: '#ecfdf5',
          borderColor: '#a7f3d0',
          label: 'AI-Powered Analysis'
        };
      case 'fallback':
        return {
          icon: 'psychology',
          color: '#d97706',
          bgColor: '#fffbeb',
          borderColor: '#fed7aa',
          label: 'Simplified Analysis'
        };
      case 'error':
        return {
          icon: 'warning',
          color: '#dc2626',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
          label: 'Basic Analysis'
        };
    }
  };

  const sourceInfo = getSourceIndicator();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
          Weekly Training Summary
        </h2>
        <button
          onClick={refreshFeedback}
          disabled={loading}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: 'white',
            color: '#374151',
            fontSize: '13px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: loading ? 0.6 : 1
          }}
        >
          <MaterialIcon name="refresh" size={14} />
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Source Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '8px 12px',
        backgroundColor: sourceInfo.bgColor,
        border: `1px solid ${sourceInfo.borderColor}`,
        borderRadius: '6px',
        fontSize: '12px',
        color: sourceInfo.color
      }}>
        <MaterialIcon name={sourceInfo.icon} size={16} style={{ color: sourceInfo.color }} />
        <span>{sourceInfo.label}</span>
        {!isGeminiConfigured && (
          <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
            (AI services not configured)
          </span>
        )}
      </div>

      {/* Feedback Content */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.5rem',
        lineHeight: '1.6',
        color: '#374151'
      }}>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
          {feedback.feedback}
        </div>
      </div>

      {/* Metadata */}
      {lastUpdated && (
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280',
          textAlign: 'center'
        }}>
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}
    </div>
  );
} 
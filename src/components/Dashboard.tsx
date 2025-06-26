import { useAuth } from '../hooks/useAuth';
import { useStravaData } from '../hooks/useStravaData';
import { useNavigate } from 'react-router-dom';
import { ZoneBar } from './ZoneBar';

export function Dashboard() {
  const { user, logout, stravaTokens, isTokenExpired } = useAuth();
  const { recentActivities, loading, syncing, error, lastSync, refreshData, clearError } = useStravaData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Access Denied</h2>
        <p>Please log in to access the dashboard.</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#2563eb',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>AI Cycling Coach Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f9fafb', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px', 
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2>Welcome, {user.name}!</h2>
        <div style={{ marginTop: '1rem' }}>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Strava ID:</strong> {user.strava_user_id}</p>
          <p><strong>Token Status:</strong> 
            <span style={{ 
              color: isTokenExpired() ? '#ef4444' : '#10b981',
              marginLeft: '8px'
            }}>
              {isTokenExpired() ? 'Expired' : 'Valid'}
            </span>
          </p>
          {stravaTokens && (
            <p><strong>Token Expires:</strong> {new Date(stravaTokens.expires_at * 1000).toLocaleString()}</p>
          )}
          {lastSync && (
            <p><strong>Last Sync:</strong> {new Date(lastSync).toLocaleString()}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Recent Activities */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '1.5rem',
          backgroundColor: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Recent Activities</h3>
            <button 
              onClick={refreshData}
              disabled={loading || syncing}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: (loading || syncing) ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {syncing ? 'Syncing...' : loading ? 'Loading...' : 'Sync with Strava'}
            </button>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '4px', 
              padding: '12px', 
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
              <button 
                onClick={clearError}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>
            </div>
          )}

          {loading && recentActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ 
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #2563eb',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              Loading activities...
            </div>
          ) : recentActivities.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentActivities.map((activity) => (
                <div 
                  key={activity.id}
                  style={{
                    border: '1px solid #f3f4f6',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{activity.name}</h4>
                      <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                        {formatDate(activity.start_date)} • {activity.type}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                        <span><strong>Distance:</strong> {formatDistance(activity.distance)}</span>
                        <span><strong>Time:</strong> {formatDuration(activity.moving_time)}</span>
                        {activity.has_power && activity.average_power && (
                          <span><strong>Avg Power:</strong> {activity.average_power}W</span>
                        )}
                        {activity.has_heartrate && activity.average_heartrate && (
                          <span><strong>Avg HR:</strong> {activity.average_heartrate} bpm</span>
                        )}
                      </div>
                      {activity.private_note && (
                        <p style={{ 
                          margin: '8px 0 0 0', 
                          fontSize: '13px', 
                          color: '#4b5563',
                          fontStyle: 'italic',
                          backgroundColor: '#f0f9ff',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          Note: {activity.private_note}
                        </p>
                      )}
                      <ZoneBar zones={(activity as any).power_zones || (activity as any).hr_zones} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p>No recent cycling activities found.</p>
              <p style={{ fontSize: '14px' }}>
                Activities from the last 30 days will appear here once you start cycling.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '1.5rem',
            backgroundColor: 'white'
          }}>
            <h3>Training Plan</h3>
            <p style={{ color: '#6b7280' }}>Your personalized training schedule</p>
            <button 
              style={{
                marginTop: '1rem',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: 'white',
                cursor: 'pointer'
              }}
              disabled
            >
              Coming Soon
            </button>
          </div>

          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '1.5rem',
            backgroundColor: 'white'
          }}>
            <h3>Coach Feedback</h3>
            <p style={{ color: '#6b7280' }}>AI insights on your training</p>
            <button 
              style={{
                marginTop: '1rem',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: 'white',
                cursor: 'pointer'
              }}
              disabled
            >
              Coming Soon
            </button>
          </div>

          {recentActivities.length > 0 && (
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '1.5rem',
              backgroundColor: 'white'
            }}>
              <h3>Quick Stats</h3>
              <div style={{ fontSize: '14px' }}>
                <p><strong>Activities (30d):</strong> {recentActivities.length}</p>
                <p><strong>Total Distance:</strong> {formatDistance(
                  recentActivities.reduce((sum, activity) => sum + activity.distance, 0)
                )}</p>
                <p><strong>Total Time:</strong> {formatDuration(
                  recentActivities.reduce((sum, activity) => sum + activity.moving_time, 0)
                )}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
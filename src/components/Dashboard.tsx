import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, logout, stravaTokens, isTokenExpired } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
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
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
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
          <h3>Recent Activities</h3>
          <p style={{ color: '#6b7280' }}>Your latest Strava activities</p>
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
      </div>
    </div>
  );
} 
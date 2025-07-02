import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePlannedSessions } from '../hooks/usePlannedSessions';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useMediaQuery';
import { CalendarView } from './CalendarView';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { CoachFeedback } from './CoachFeedback';
import { Settings } from './Settings';

export function Dashboard() {
  const { user } = useAuth();
  const plannedSessions = usePlannedSessions();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<'calendar' | 'coach' | 'settings'>('calendar');

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

  const renderMainContent = () => {
    switch (activeView) {
      case 'calendar':
        return <CalendarView plannedSessions={plannedSessions} />;
      case 'coach':
        return (
          <div style={{ 
            height: isMobile ? '100vh' : '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: 'white',
            paddingBottom: isMobile ? '80px' : '0' // Space for bottom nav on mobile
          }}>
            <div style={{ 
              padding: isMobile ? '1rem' : '2rem',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: isMobile ? '1.25rem' : '1.5rem', 
                color: '#1e293b' 
              }}>
                AI Coach
              </h1>
              <p style={{ 
                margin: '0.5rem 0 0 0', 
                fontSize: '14px', 
                color: '#64748b' 
              }}>
                Personalized feedback and training insights
              </p>
            </div>
            <div style={{ 
              flex: 1, 
              padding: isMobile ? '1rem' : '2rem',
              overflow: 'auto' 
            }}>
              <CoachFeedback />
            </div>
          </div>
        );
      case 'settings':
        return (
          <div style={{
            height: '100vh',
            paddingBottom: isMobile ? '80px' : '0',
            overflow: 'auto'
          }}>
            <Settings />
          </div>
        );
      default:
        return <CalendarView plannedSessions={plannedSessions} />;
    }
  };

  if (isMobile) {
    // Mobile layout with bottom navigation
    return (
      <div style={{ 
        backgroundColor: '#f8fafc', 
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Main Content */}
        <div style={{ width: '100%' }}>
          {renderMainContent()}
        </div>
        
        {/* Bottom Navigation */}
        <BottomNavigation activeItem={activeView} onItemClick={setActiveView} />
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar activeItem={activeView} onItemClick={setActiveView} />
      
      {/* Main Content */}
      <div style={{ flex: 1, height: '100vh' }}>
        {renderMainContent()}
      </div>
    </div>
  );
} 
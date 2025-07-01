import { useState, useMemo } from 'react';
import { useStravaData } from '../hooks/useStravaData';
import { useGoals } from '../hooks/useGoals';
import { MiniChart } from './MiniChart';
import { MaterialIcon } from './MaterialIcon';
import type { TrainingSession, StravaActivity, EventGoal } from '../types';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  plannedSessions: TrainingSession[];
  actualActivities: StravaActivity[];
  goals: EventGoal[];
}

interface CalendarViewProps {
  plannedSessions?: TrainingSession[];
}

export function CalendarView({ plannedSessions = [] }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { recentActivities } = useStravaData();
  const { goals } = useGoals();

  // Get all activities from the last 90 days to ensure we have data for the calendar
  const extendedActivities = recentActivities; // For now, using the same data

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month and first day of the calendar grid
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfCalendar = new Date(firstDayOfMonth);
    firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay());
    
    // Generate 42 days (6 weeks) for the calendar grid
    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(firstDayOfCalendar);
      date.setDate(date.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === new Date().toDateString();
      
      // Filter planned sessions for this date
      const dayPlannedSessions = plannedSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.toDateString() === date.toDateString();
      });
      
      // Filter actual activities for this date
      const dayActivities = extendedActivities.filter(activity => {
        const activityDate = new Date(activity.start_date);
        return activityDate.toDateString() === date.toDateString();
      });
      
      // Filter goals for this date
      const dayGoals = goals.filter(goal => {
        const goalDate = new Date(goal.target_date);
        return goalDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        plannedSessions: dayPlannedSessions,
        actualActivities: dayActivities,
        goals: dayGoals,
      });
    }
    
    return days;
  }, [currentDate, plannedSessions, extendedActivities, goals]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };



  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ 
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Compact Calendar Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 2rem',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        flexShrink: 0
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: '#1e293b',
          margin: 0
        }}>
          Training Calendar
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '12px', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '2px' }}></div>
              <span>Planned</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#dcfce7', borderRadius: '2px' }}></div>
              <span>Completed</span>
            </div>
          </div>
          
          {/* Navigation Chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '4px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <button
              onClick={() => navigateMonth('prev')}
              style={{
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '16px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '14px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <MaterialIcon name="chevron_left" size={16} />
            </button>
            
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              padding: '0 12px',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            
            <button
              onClick={() => navigateMonth('next')}
              style={{
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '16px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '14px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <MaterialIcon name="chevron_right" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ 
        flex: 1,
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gridTemplateRows: 'auto repeat(6, 1fr)',
        gap: '1px',
        backgroundColor: '#e2e8f0',
        margin: '0',
        overflow: 'hidden'
      }}>
        {/* Day Headers */}
        {dayNames.map(day => (
          <div key={day} style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            textAlign: 'center',
            fontWeight: '600',
            color: '#475569',
            fontSize: '14px'
          }}>
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendarData.map((day, index) => {
          const hasActivities = day.actualActivities.length > 0;
          const hasGoals = day.goals.length > 0;
          
          return (
            <div
              key={index}
              style={{
                padding: '6px 6px 30px 6px', // Extra bottom padding for chart
                backgroundColor: day.isToday 
                  ? '#fef3c7' 
                  : hasActivities
                    ? '#f0fdf4'  // Very subtle green background for days with activities
                    : day.isCurrentMonth 
                      ? 'white' 
                      : '#f8fafc',
                border: hasActivities && !day.isToday ? '1px solid #dcfce7' : 'none',
                borderLeft: day.isToday ? '3px solid #f59e0b' : (hasActivities ? '2px solid #86efac' : 'none'),
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
            {/* Date Number */}
            <div style={{
              fontSize: '14px',
              fontWeight: day.isToday ? '700' : '500',
              color: day.isCurrentMonth 
                ? (day.isToday ? '#92400e' : '#1e293b')
                : '#94a3b8',
              marginBottom: '4px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '4px'
            }}>
              <span style={{
                ...(hasGoals && {
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '2px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white'
                })
              }}>
                {day.date.getDate()}
              </span>
              {hasGoals && (
                <span title={`Goal: ${day.goals[0]?.description}`}>
                  <MaterialIcon name="flag" size={12} style={{ color: '#f59e0b' }} />
                </span>
              )}
            </div>
            
            {/* Activities and Sessions */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', minHeight: 0 }}>
              {/* Planned Sessions */}
              {day.plannedSessions.map(session => (
                <div
                  key={session.id}
                  style={{
                    padding: '2px 4px',
                    backgroundColor: '#dbeafe',
                    border: '1px dashed #3b82f6',
                    borderRadius: '2px',
                    fontSize: '10px',
                    color: '#1e40af',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  title={`${session.type} - ${session.description}`}
                >
                  📅 {session.type}
                </div>
              ))}
              
              {/* Actual Activities */}
              {day.actualActivities.map(activity => {
                const formatDuration = (seconds: number) => {
                  const hours = Math.floor(seconds / 3600);
                  const minutes = Math.floor((seconds % 3600) / 60);
                  if (hours > 0) {
                    return `${hours}h ${minutes}m`;
                  }
                  return `${minutes}m`;
                };

                return (
                  <div key={activity.id} style={{ flexShrink: 0 }}>
                    {/* Activity Title */}
                    <div
                      style={{
                        padding: '1px 0',
                        fontSize: '10px',
                        color: '#374151',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        fontWeight: '500'
                      }}
                      title={activity.name}
                    >
                      {activity.name.length > 25 ? activity.name.substring(0, 25) + '...' : activity.name}
                    </div>
                    
                    {/* Time & Distance */}
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#6b7280',
                      marginBottom: '2px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{formatDuration(activity.moving_time)}</span>
                      <span>{(activity.distance / 1000).toFixed(1)}km</span>
                    </div>
                  </div>
                                 );
               })}
             </div>
             
             {/* Chart Overlay - positioned at bottom of cell */}
             {day.actualActivities.length > 0 && day.actualActivities[0].activity_streams && (
               <MiniChart 
                 streams={day.actualActivities[0].activity_streams}
                 width={100}
                 height={25}
                 showPower={day.actualActivities[0].has_power && (day.actualActivities[0].activity_streams.watts_stream?.length || 0) > 0}
                 activity={day.actualActivities[0]}
               />
             )}
           </div>
         );
       })}
       </div>
     </div>
   );
} 
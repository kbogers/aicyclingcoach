import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStravaData } from '../hooks/useStravaData';
import { useGoals } from '../hooks/useGoals';
import { MaterialIcon } from './MaterialIcon';
import type { EventGoal } from '../types';

export function Settings() {
  const { user, logout, isTokenExpired } = useAuth();
  const { lastSync } = useStravaData();
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals();
  
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<EventGoal | null>(null);
  const [goalDescription, setGoalDescription] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalDescription.trim() || !goalDate) return;

    setSaving(true);
    
    const result = editingGoal 
      ? await updateGoal(editingGoal.id, goalDescription.trim(), goalDate)
      : await addGoal(goalDescription.trim(), goalDate);

    if (result.success) {
      setShowGoalForm(false);
      setEditingGoal(null);
      setGoalDescription('');
      setGoalDate('');
    } else {
      alert('Error saving goal: ' + result.error);
    }
    
    setSaving(false);
  };

  const handleEditGoal = (goal: EventGoal) => {
    setEditingGoal(goal);
    setGoalDescription(goal.description);
    setGoalDate(goal.target_date);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    const result = await deleteGoal(goalId);
    if (!result.success) {
      alert('Error deleting goal: ' + result.error);
    }
  };

  const handleCancelForm = () => {
    setShowGoalForm(false);
    setEditingGoal(null);
    setGoalDescription('');
    setGoalDate('');
  };

  if (!user) {
    return <div>Please log in to access settings.</div>;
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '2rem',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
          Settings
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', color: '#64748b' }}>
          Configure your training preferences and goals
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Training Goals Section */}
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#1e293b' }}>Training Goals</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '14px', color: '#64748b' }}>
                  Set your training targets and event goals
                </p>
              </div>
              {!showGoalForm && (
                <button
                  onClick={() => setShowGoalForm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '8px 16px',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <MaterialIcon name="add" size={16} />
                  Add Goal
                </button>
              )}
            </div>

            {/* Goal Form */}
            {showGoalForm && (
              <form onSubmit={handleSubmitGoal} style={{ 
                backgroundColor: '#f9fafb', 
                padding: '1rem', 
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                    What are you training for?
                  </label>
                  <textarea
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="e.g., Complete my first century ride, Train for the local cycling race, Improve my FTP by 20 watts..."
                    required
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                    By when do you want to achieve this?
                  </label>
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    required
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    {saving ? 'Saving...' : (editingGoal ? 'Update Goal' : 'Save Goal')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Goals List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                Loading goals...
              </div>
            ) : goals.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: '#64748b',
                backgroundColor: '#f9fafb',
                borderRadius: '6px'
              }}>
                <MaterialIcon name="flag" size={32} style={{ color: '#d1d5db', marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>
                  No training goals set yet. Add your first goal to get started!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {goals.map((goal) => (
                  <div key={goal.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '14px', lineHeight: '1.4', color: '#374151' }}>
                          {goal.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '12px' }}>
                          <MaterialIcon name="event" size={14} />
                          <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={() => handleEditGoal(goal)}
                          style={{
                            padding: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: 'transparent',
                            color: '#64748b',
                            cursor: 'pointer'
                          }}
                          title="Edit goal"
                        >
                          <MaterialIcon name="edit" size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          style={{
                            padding: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                          title="Delete goal"
                        >
                          <MaterialIcon name="delete" size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Information Section */}
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', color: '#1e293b' }}>
              Account Information
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <strong style={{ fontSize: '14px', color: '#374151' }}>Email:</strong>
                <span style={{ marginLeft: '8px', fontSize: '14px', color: '#64748b' }}>{user.email}</span>
              </div>
              
              {user.strava_user_id && (
                <div>
                  <strong style={{ fontSize: '14px', color: '#374151' }}>Strava ID:</strong>
                  <span style={{ marginLeft: '8px', fontSize: '14px', color: '#64748b' }}>{user.strava_user_id}</span>
                </div>
              )}
              
              <div>
                <strong style={{ fontSize: '14px', color: '#374151' }}>Status:</strong>
                <span style={{ 
                  marginLeft: '8px',
                  fontSize: '14px',
                  color: isTokenExpired() ? '#ef4444' : '#10b981'
                }}>
                  {isTokenExpired() ? 'Token Expired' : 'Connected'}
                </span>
              </div>
              
              {lastSync && (
                <div>
                  <strong style={{ fontSize: '14px', color: '#374151' }}>Last Sync:</strong>
                  <span style={{ marginLeft: '8px', fontSize: '14px', color: '#64748b' }}>
                    {new Date(lastSync).toLocaleString()}
                  </span>
                </div>
              )}
              
              <div style={{ marginTop: '1rem' }}>
                <button 
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
import { useState } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { useGoals } from '../hooks/useGoals';

interface SidebarProps {
  activeItem: 'calendar' | 'coach' | 'settings';
  onItemClick: (item: 'calendar' | 'coach' | 'settings') => void;
}

interface SidebarItemProps {
  id: 'calendar' | 'coach' | 'settings';
  icon: string;
  label: string;
  active: boolean;
  showIndicator?: boolean;
  onClick: () => void;
}

function SidebarItem({ icon, label, active, showIndicator = false, onClick }: SidebarItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        style={{
          width: '48px',
          height: '48px',
          border: 'none',
          borderRadius: '12px',
          backgroundColor: active ? '#3b82f6' : (isHovered ? '#f1f5f9' : 'transparent'),
          color: active ? 'white' : '#64748b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          transition: 'all 0.2s ease',
          margin: '4px 0',
          position: 'relative'
        }}
      >
        <MaterialIcon name={icon} size={20} />
        {/* Red dot indicator */}
        {showIndicator && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white'
            }}
          />
        )}
      </button>
      
      {/* Hover Label */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            left: '60px',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-50%)',
            top: '50%'
          }}
        >
          {label}
          {/* Arrow pointing to button */}
          <div
            style={{
              position: 'absolute',
              left: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderRight: '4px solid #1f2937'
            }}
          />
        </div>
      )}
    </div>
  );
}

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const { hasGoals, loading } = useGoals();
  const showSettingsIndicator = !loading && !hasGoals;

  const menuItems = [
    { id: 'calendar' as const, icon: 'calendar_month', label: 'Calendar' },
    { id: 'coach' as const, icon: 'fitness_center', label: 'Coach' },
    { id: 'settings' as const, icon: 'settings', label: 'Settings', showIndicator: showSettingsIndicator }
  ];

  return (
    <div
      style={{
        width: '64px',
        height: '100vh',
        backgroundColor: 'white',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 8px 12px 8px',
        flexShrink: 0,
        boxShadow: '2px 0 4px -1px rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box'
      }}
    >
      {/* Logo/Brand */}
      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#3b82f6',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}
      >
        <MaterialIcon name="pedal_bike" size={20} style={{ color: 'white' }} />
      </div>

      {/* Menu Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            id={item.id}
            icon={item.icon}
            label={item.label}
            active={activeItem === item.id}
            showIndicator={item.showIndicator}
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User Avatar/Profile (placeholder) */}
      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#f1f5f9',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <MaterialIcon name="account_circle" size={24} style={{ color: '#64748b' }} />
      </div>
    </div>
  );
} 
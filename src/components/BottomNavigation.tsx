import { MaterialIcon } from './MaterialIcon';
import { useGoals } from '../hooks/useGoals';

interface BottomNavigationProps {
  activeItem: 'calendar' | 'coach' | 'settings';
  onItemClick: (item: 'calendar' | 'coach' | 'settings') => void;
}

interface NavItemProps {
  id: 'calendar' | 'coach' | 'settings';
  icon: string;
  label: string;
  active: boolean;
  showIndicator?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, showIndicator = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '8px 4px',
        position: 'relative',
        transition: 'all 0.2s ease',
        minHeight: '60px'
      }}
    >
      <div style={{ position: 'relative' }}>
        <MaterialIcon 
          name={icon} 
          size={24} 
          style={{ 
            color: active ? '#3b82f6' : '#9ca3af',
            transition: 'color 0.2s ease'
          }} 
        />
        {/* Red dot indicator */}
        {showIndicator && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white'
            }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: '11px',
          fontWeight: active ? '600' : '400',
          color: active ? '#3b82f6' : '#9ca3af',
          transition: 'all 0.2s ease',
          textAlign: 'center'
        }}
      >
        {label}
      </span>
    </button>
  );
}

export function BottomNavigation({ activeItem, onItemClick }: BottomNavigationProps) {
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
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)', // Safe area for devices with home indicator
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 100
      }}
    >
      {menuItems.map((item) => (
        <NavItem
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
  );
} 
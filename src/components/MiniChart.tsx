import { useState } from 'react';
import type { ActivityStreams, StravaActivity } from '../types';

interface MiniChartProps {
  streams?: ActivityStreams;
  width?: number;
  height?: number;
  showPower?: boolean; // If false, shows HR
  activity?: StravaActivity;
}

export function MiniChart({ streams, width = 120, height = 40, showPower = true, activity }: MiniChartProps) {
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0
  });

  if (!streams) return null;

  const data = showPower ? streams.watts_stream : streams.heartrate_stream;
  const timeData = streams.time_stream;

  if (!data || !timeData || data.length === 0) return null;

  // Sample data for better performance (max 60 points)
  const sampleRate = Math.max(1, Math.floor(data.length / 60));
  const sampledData = data.filter((_, index) => index % sampleRate === 0);
  const sampledTime = timeData.filter((_, index) => index % sampleRate === 0);

  if (sampledData.length < 2) return null;

  const minValue = Math.min(...sampledData);
  const maxValue = Math.max(...sampledData);
  const valueRange = maxValue - minValue;

  if (valueRange === 0) return null;

  const maxTime = Math.max(...sampledTime);

  // Create SVG path
  const points = sampledData.map((value, index) => {
    const x = (sampledTime[index] / maxTime) * width;
    const y = height - ((value - minValue) / valueRange) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  // Determine color based on data type
  const strokeColor = showPower ? '#3b82f6' : '#ef4444'; // Blue for power, red for HR
  const fillColor = showPower ? '#dbeafe' : '#fee2e2'; // Light blue/red

  // Create tooltip content with stats
  const createTooltip = () => {
    if (!activity) return '';
    
    const parts = [];
    if (showPower && activity.average_power && activity.max_power) {
      parts.push(`Power: ${activity.average_power}W avg, ${activity.max_power}W max`);
    }
    if (!showPower && activity.average_heartrate && activity.max_heartrate) {
      parts.push(`Heart Rate: ${activity.average_heartrate} avg, ${activity.max_heartrate} max bpm`);
    }
    if (activity.average_heartrate && activity.max_heartrate && showPower) {
      parts.push(`Heart Rate: ${activity.average_heartrate} avg, ${activity.max_heartrate} max bpm`);
    }
    if (activity.average_power && activity.max_power && !showPower) {
      parts.push(`Power: ${activity.average_power}W avg, ${activity.max_power}W max`);
    }
    
    return parts.join('\n');
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0 });
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: height,
          width: '100%'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
          width="100%" 
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ 
            display: 'block',
            cursor: 'pointer'
          }}
        >
          {/* Fill area under curve */}
          <path
            d={`${pathData} L ${width},${height} L 0,${height} Z`}
            fill={fillColor}
            opacity={0.2}
          />
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
          />
        </svg>
      </div>
      
      {/* Custom Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'pre-line',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {createTooltip()}
        </div>
      )}
    </>
  );
} 
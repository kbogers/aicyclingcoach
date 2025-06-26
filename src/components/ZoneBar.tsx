import React from 'react';

export interface ZoneDistribution {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
  z6?: number;
  z7?: number;
}

interface ZoneBarProps {
  zones: ZoneDistribution | null;
  height?: number;
}

const zoneColors = ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#fbbf24', '#ef4444'];

export function ZoneBar({ zones, height = 8 }: ZoneBarProps) {
  if (!zones) return null;
  const values = [zones.z1, zones.z2, zones.z3, zones.z4, zones.z5, zones.z6 ?? 0, zones.z7 ?? 0];
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;

  return (
    <div style={{ display: 'flex', width: '100%', height: `${height}px`, marginTop: '6px', borderRadius: '4px', overflow: 'hidden' }}>
      {values.map((v, idx) => {
        if (!v) return null;
        const widthPct = (v / total) * 100;
        return (
          <div key={idx} style={{ width: `${widthPct}%`, backgroundColor: zoneColors[idx] }} />
        );
      })}
    </div>
  );
} 
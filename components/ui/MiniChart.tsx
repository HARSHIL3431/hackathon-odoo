import React from 'react';

export type MiniChartType = 'bar' | 'line';

interface MiniChartProps {
  data: number[];
  type?: MiniChartType;
  color?: string;
  height?: number;
}

export default function MiniChart({ 
  data, 
  type = 'bar', 
  color = 'currentColor',
  height = 40
}: MiniChartProps) {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data, 1); // Avoid division by zero
  const min = Math.min(...data, 0);
  const range = max - min;
  
  const width = 100;
  const padding = 2;
  const usableHeight = height - padding * 2;
  
  // Bar Chart
  if (type === 'bar') {
    const barWidth = Math.max((width - padding * 2) / data.length - 2, 2);
    const step = (width - padding * 2) / data.length;
    
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        {data.map((val, i) => {
          const h = (val / max) * usableHeight;
          const x = padding + i * step + (step - barWidth) / 2;
          const y = height - padding - h;
          return (
            <rect 
              key={i} 
              x={x} 
              y={y} 
              width={barWidth} 
              height={Math.max(h, 2)} 
              fill={color} 
              rx={1}
              className="opacity-70 hover:opacity-100 transition-opacity"
            />
          );
        })}
      </svg>
    );
  }
  
  // Line Chart
  const step = (width - padding * 2) / Math.max(data.length - 1, 1);
  const points = data.map((val, i) => {
    const h = (val / max) * usableHeight;
    const x = padding + i * step;
    const y = height - padding - h;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <polyline 
        points={points} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

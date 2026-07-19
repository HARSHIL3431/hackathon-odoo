'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatPrefix?: string;
  formatSuffix?: string;
}

export default function AnimatedCounter({ 
  value, 
  duration = 1000, 
  formatPrefix = '', 
  formatSuffix = '' 
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  
  useEffect(() => {
    // Reset if value changes
    setCount(0);
    startTime.current = null;
    
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      
      const progress = timestamp - startTime.current;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(easeOut * value));
      
      if (percentage < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);
  
  return (
    <span>
      {formatPrefix}
      {count.toLocaleString()}
      {formatSuffix}
    </span>
  );
}

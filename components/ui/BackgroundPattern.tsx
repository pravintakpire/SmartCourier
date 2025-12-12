
import React from 'react';

export const BackgroundPattern: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <svg className="w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Recreating the gradient definitions from Logo.tsx for consistency */}
          <linearGradient id="pat-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="pat-grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="pat-grad3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#d946ef', stopOpacity: 1 }} />
          </linearGradient>

          {/* Define the repeating pattern cell (120x120 pixels) */}
          <pattern id="logo-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
             <g transform="translate(10, 10) scale(1)">
                {/* Top Face */}
                <path d="M50 25 L85 45 L50 65 L15 45 Z" fill="url(#pat-grad2)" />
                {/* Left Face */}
                <path d="M15 45 L50 65 L50 100 L15 80 Z" fill="url(#pat-grad1)" />
                {/* Right Face */}
                <path d="M50 65 L85 45 L85 80 L50 100 Z" fill="url(#pat-grad3)" />
             </g>
          </pattern>
        </defs>
        
        {/* Fill the entire screen with the pattern */}
        <rect width="100%" height="100%" fill="url(#logo-pattern)" />
      </svg>
    </div>
  );
};

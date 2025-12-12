
import React from 'react';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  // Size mapping
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  const fontSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl';

  return (
    <div className="flex items-center gap-3 select-none group">
      <div className={`relative ${dim}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} /> {/* Indigo */}
              <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} /> {/* Pink */}
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} /> {/* Blue */}
              <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} /> {/* Cyan */}
            </linearGradient>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} /> {/* Violet */}
              <stop offset="100%" style={{ stopColor: '#d946ef', stopOpacity: 1 }} /> {/* Fuchsia */}
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Top Face - Floats Up */}
          <path 
            d="M50 25 L85 45 L50 65 L15 45 Z" 
            fill="url(#grad2)" 
            className="animate-float-top"
            style={{ transformOrigin: 'center' }}
          />

          {/* Left Face - Floats Left */}
          <path 
            d="M15 45 L50 65 L50 100 L15 80 Z" 
            fill="url(#grad1)" 
            className="animate-float-left"
            style={{ transformOrigin: 'center' }}
          />

          {/* Right Face - Floats Right */}
          <path 
            d="M50 65 L85 45 L85 80 L50 100 Z" 
            fill="url(#grad3)" 
            className="animate-float-right"
            style={{ transformOrigin: 'center' }}
          />
          
          {/* Inner Core Glow */}
          <circle cx="50" cy="65" r="5" fill="white" className="animate-pulse opacity-80" filter="url(#glow)" />
        </svg>
      </div>
      
      {/* Text Part */}
      <div className={`font-bold tracking-tight leading-none ${fontSize}`}>
        <span className="text-white">Smart</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">Courier</span>
      </div>

      {/* Internal Styles for the animation */}
      <style>{`
        @keyframes float-top {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes float-left {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-3px, 3px); }
        }
        @keyframes float-right {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(3px, 3px); }
        }
        .animate-float-top { animation: float-top 3s ease-in-out infinite; }
        .animate-float-left { animation: float-left 3s ease-in-out infinite; }
        .animate-float-right { animation: float-right 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

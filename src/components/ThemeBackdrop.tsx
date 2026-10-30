import React from 'react';
import { StoryTheme } from '../types/game';

interface ThemeBackdropProps {
  theme: StoryTheme;
  className?: string;
  children?: React.ReactNode;
}

export const ThemeBackdrop: React.FC<ThemeBackdropProps> = ({ theme, className = '', children }) => {
  if (theme === 'galaxy') {
    return (
      <div className={`relative overflow-hidden bg-slate-950 text-white ${className}`}>
        {/* Galaxy cosmic background with SVG stars and glowing nebulas */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="nebula1" cx="30%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nebula2" cx="80%" cy="70%" r="45%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
              </radialGradient>
              <pattern id="stars" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="20" r="1.2" fill="#ffffff" opacity="0.8" />
                <circle cx="75" cy="35" r="1.8" fill="#e0e7ff" opacity="0.9" />
                <circle cx="45" cy="80" r="1.0" fill="#a5b4fc" opacity="0.6" />
                <circle cx="85" cy="85" r="1.4" fill="#ffffff" opacity="0.7" />
                <circle cx="20" cy="65" r="1.6" fill="#fbcfe8" opacity="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#nebula1)" />
            <rect width="100%" height="100%" fill="url(#nebula2)" />
            <rect width="100%" height="100%" fill="url(#stars)" />
            {/* Playful cartoon orbit planet */}
            <circle cx="90%" cy="20%" r="48" fill="#38bdf8" opacity="0.25" />
            <ellipse cx="90%" cy="20%" rx="70" ry="16" fill="none" stroke="#7dd3fc" strokeWidth="2" opacity="0.3" transform="rotate(-25 90% 20%)" />
          </svg>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  if (theme === 'jungle') {
    return (
      <div className={`relative overflow-hidden bg-emerald-950 text-white ${className}`}>
        {/* Tropical jungle background with lush canopy SVG shapes */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="sunbeams" cx="50%" cy="10%" r="70%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#sunbeams)" />
            {/* Tropical leaf contours */}
            <path d="M-20,120 Q80,20 220,100 T400,80" fill="none" stroke="#10b981" strokeWidth="3" opacity="0.4" />
            <circle cx="10%" cy="80%" r="60" fill="#047857" opacity="0.2" />
            <circle cx="85%" cy="30%" r="45" fill="#059669" opacity="0.2" />
          </svg>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  if (theme === 'detective') {
    return (
      <div className={`relative overflow-hidden bg-slate-900 text-white ${className}`}>
        {/* Detective mystery laboratory with blueprint grid */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="labGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#labGrid)" />
            <circle cx="15%" cy="30%" r="70" fill="#0284c7" opacity="0.15" />
            <circle cx="85%" cy="75%" r="90" fill="#6366f1" opacity="0.12" />
          </svg>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  // Magic Castle default
  return (
    <div className={`relative overflow-hidden bg-violet-950 text-white ${className}`}>
      {/* Magic castle stars and mystical aura */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="magicAura" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2e1065" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#magicAura)" />
          <polygon points="50,15 60,35 85,38 65,55 72,80 50,68 28,80 35,55 15,38 40,35" fill="#fde047" opacity="0.2" transform="translate(100, 40) scale(0.6)" />
        </svg>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

import React from 'react';

export interface TrueMotionQCLogoProps {
  variant?: 'dark' | 'light' | 'artisanal' | 'sidebar' | 'burgundy' | 'cobalt';
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'sidebar';
}

export const TrueMotionQCLogo: React.FC<TrueMotionQCLogoProps> = ({
  variant = 'cobalt',
  compact = false,
  showTagline = true,
  className = '',
  size = 'md',
}) => {
  const isDarkSurface = variant === 'dark' || variant === 'burgundy';
  const isCobalt = variant === 'cobalt' || variant === 'sidebar' || variant === 'light';

  const markSize = {
    sm: 24,
    md: 28,
    lg: 34,
    sidebar: 28,
  }[size];

  const primaryStroke = isDarkSurface ? '#E6D2B5' : '#0B1A4B';
  const accentStroke = isDarkSurface ? '#C4A46B' : '#0A22B8';
  const wordmarkColor = isDarkSurface ? 'text-[#EFE3D2]' : 'text-[#0B1A4B]';
  const tagColor = isDarkSurface ? 'text-[#C4A46B]/85' : 'text-[#64748B]';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Crest Icon inside subtle rounded frame */}
      <div className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center shrink-0 shadow-xs">
        <svg
          width={markSize - 8}
          height={markSize - 8}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top horizontal serif bar */}
          <path
            d="M5 7H27"
            stroke={primaryStroke}
            strokeWidth="2.4"
            strokeLinecap="square"
          />
          <path
            d="M5 7V10.5M27 7V10.5"
            stroke={accentStroke}
            strokeWidth="2"
            strokeLinecap="square"
          />
          {/* Double-pillar stem */}
          <path
            d="M13.5 10V25M18.5 10V25"
            stroke={primaryStroke}
            strokeWidth="2.2"
            strokeLinecap="square"
          />
          {/* Base serif */}
          <path
            d="M10 25H22"
            stroke={accentStroke}
            strokeWidth="2"
            strokeLinecap="square"
          />
        </svg>
      </div>

      {!compact && (
        <div className="flex flex-col min-w-0 justify-center">
          <div className="flex items-center gap-1.5">
            <span className={`font-display text-[20px] font-semibold tracking-tight leading-none ${wordmarkColor}`}>
              TrueMotion
            </span>
            <span
              className={`text-[9.5px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded leading-none ${
                isDarkSurface
                  ? 'bg-[#C4A46B]/20 text-[#C4A46B] border border-[#C4A46B]/35'
                  : 'bg-[#0A22B8] text-white'
              }`}
            >
              QC
            </span>
          </div>
          {showTagline && (
            <span className={`text-[8.5px] tracking-[0.2em] font-semibold uppercase mt-0.5 ${tagColor}`}>
              SELLER ATELIER
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const TradeMartLogo = TrueMotionQCLogo;
export const TrueMotionLogo = TrueMotionQCLogo;
export type TradeMartLogoProps = TrueMotionQCLogoProps;


import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'md', fullScreen = false, text }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg
          className={`animate-spin ${sizeClasses[size]} text-primary-600`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {text && (
        <p className="text-sm text-gray-500 animate-pulse-soft">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-50 animate-fade-in">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6">
      {spinner}
    </div>
  );
};

// Skeleton loading component for content placeholders
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

// Card skeleton for boards
export const BoardCardSkeleton: React.FC = () => (
  <div className="rounded-xl overflow-hidden shadow-soft">
    <div className="skeleton h-24" />
    <div className="bg-white p-4 space-y-3">
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="flex gap-2">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    </div>
  </div>
);

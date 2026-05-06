import React from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
  status?: 'online' | 'away' | 'offline';
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorFromName = (name: string): string => {
  const colors = [
    'from-red-500 to-rose-600',
    'from-orange-500 to-amber-600',
    'from-amber-500 to-yellow-600',
    'from-lime-500 to-green-600',
    'from-green-500 to-emerald-600',
    'from-emerald-500 to-teal-600',
    'from-teal-500 to-cyan-600',
    'from-cyan-500 to-sky-600',
    'from-sky-500 to-blue-600',
    'from-blue-500 to-indigo-600',
    'from-indigo-500 to-violet-600',
    'from-violet-500 to-purple-600',
    'from-purple-500 to-fuchsia-600',
    'from-fuchsia-500 to-pink-600',
    'from-pink-500 to-rose-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  className = '',
  showStatus = false,
  status = 'offline',
}) => {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  const statusIndicator = showStatus && (
    <span 
      className={`
        absolute bottom-0 right-0 
        ${statusSizes[size]} ${statusColors[status]}
        rounded-full ring-2 ring-white
      `}
    />
  );

  if (src) {
    return (
      <div className={`relative inline-block ${className}`}>
        <img
          src={src}
          alt={name}
          className={`
            ${sizeClasses[size]} rounded-full object-cover
            ring-2 ring-white shadow-soft
            transition-transform duration-200 hover:scale-105
          `}
        />
        {statusIndicator}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          bg-gradient-to-br ${getColorFromName(name)}
          rounded-full flex items-center justify-center
          text-white font-semibold
          ring-2 ring-white shadow-soft
          transition-transform duration-200 hover:scale-105
        `}
        title={name}
      >
        {getInitials(name)}
      </div>
      {statusIndicator}
    </div>
  );
};

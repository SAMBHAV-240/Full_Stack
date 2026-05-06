import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-200 ease-smooth
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-[0.98] select-none
  `;
  
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-primary-600 to-primary-500 text-white 
      hover:from-primary-700 hover:to-primary-600 
      focus-visible:ring-primary-500 
      shadow-soft hover:shadow-soft-md
    `,
    secondary: `
      bg-gray-100 text-gray-900 
      hover:bg-gray-200 
      focus-visible:ring-gray-500
      border border-gray-200
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-500 text-white 
      hover:from-red-700 hover:to-red-600 
      focus-visible:ring-red-500
      shadow-soft hover:shadow-soft-md
    `,
    ghost: `
      bg-transparent text-gray-700 
      hover:bg-gray-100 
      focus-visible:ring-gray-500
    `,
    outline: `
      bg-transparent text-primary-600 
      border-2 border-primary-600 
      hover:bg-primary-50 
      focus-visible:ring-primary-500
    `,
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

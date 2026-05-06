import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleDarkMode } from '../../store/slices/uiSlice';

export const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.ui.darkMode);

  const handleToggle = () => {
    dispatch(toggleDarkMode());
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        inline-flex items-center justify-center p-2 rounded-lg
        transition-colors duration-200
        ${darkMode
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        dark:focus:ring-offset-gray-950
      `}
      title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
    >
      {darkMode ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};

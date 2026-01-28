import { Sun, Moon } from 'feather-icons-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Render placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return <div className="w-5 h-5" />;
  }

  const Icon = theme === 'light' ? Sun : Moon;

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Current theme: ${theme}. Click to change.`}
      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:cursor-pointer"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

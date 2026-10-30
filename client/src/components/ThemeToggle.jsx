import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  return <button className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''}`} onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title="Change appearance">
    <span className={theme === 'dark' ? 'active' : ''}><Moon size={15} /></span><span className={theme === 'light' ? 'active' : ''}><Sun size={15} /></span>
  </button>;
}

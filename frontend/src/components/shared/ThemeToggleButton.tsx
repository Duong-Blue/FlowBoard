import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateUserLocally } from '@/store/slices/authSlice';
import { updateUserProfile } from '@/services/userService';

const NEXT_THEME: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const NEXT_THEME_LABEL: Record<Theme, string> = {
  light: 'Switch to dark theme',
  dark: 'Switch to system theme',
  system: 'Switch to light theme',
};

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleToggle = () => {
    const nextTheme = NEXT_THEME[theme];
    setTheme(nextTheme);

    if (user) {
      dispatch(updateUserLocally({ theme: nextTheme }));
      updateUserProfile({ theme: nextTheme }).catch(() => {});
    }
  };

  const nextLabel = NEXT_THEME_LABEL[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={nextLabel}
      title={nextLabel}
      className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-600"
    >
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
      {theme === 'system' && <Monitor className="h-4 w-4" />}
      <span className="sr-only">{nextLabel}</span>
    </Button>
  );
}

export default ThemeToggleButton;

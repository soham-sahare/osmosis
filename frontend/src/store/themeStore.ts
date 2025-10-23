import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_CONSTANTS } from '../constants/app';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          // Update document class
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: newTheme };
        }),
      setTheme: (theme) =>
        set(() => {
          // Update document class
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme };
        }),
    }),
    {
      name: APP_CONSTANTS.STORAGE.THEME,
    }
  )
);

// Initialize theme on load
const storedTheme = localStorage.getItem(APP_CONSTANTS.STORAGE.THEME);
if (storedTheme) {
  try {
    const parsed = JSON.parse(storedTheme);
    const theme = parsed.state?.theme || parsed; // Handle both zustand format and raw string if valid JSON
    if (theme === 'dark' || theme === 'light') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  } catch (e) {
    // If parsing fails, it might be a raw string 'light' or 'dark' (though JSON.parse should fail on 'light' without quotes)
    // Or it might be invalid. We'll fallback to checking if the string itself is 'dark'.
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }
} else {
  // Fallback to system preference if no stored theme
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

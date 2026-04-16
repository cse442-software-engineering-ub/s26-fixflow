//Added DarkMode Fam//
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

type Theme = 'light' | 'dark';

interface DarkModeContextValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  /** Apply a value from the server without sending it back via API */
  syncFromServer: (theme: Theme) => void;
}

const DarkModeContext = createContext<DarkModeContextValue>({
  darkMode: false,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
  syncFromServer: () => {},
});

export function useDarkMode() {
  return useContext(DarkModeContext);
}

function applyDarkClass(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(() => {
    const stored = localStorage.getItem('theme_preference');
    if (stored === 'dark' || stored === 'light') {
      const val = stored === 'dark';
      applyDarkClass(val);
      return val;
    }
    return false;
  });

  useEffect(() => {
    applyDarkClass(darkMode);
  }, [darkMode]);

  const setDarkMode = useCallback((enabled: boolean) => {
    const theme: Theme = enabled ? 'dark' : 'light';
    setDarkModeState(enabled);
    localStorage.setItem('theme_preference', theme);
    applyDarkClass(enabled);
    api.themeUpdate(theme).catch(() => {});
  }, []);

  const syncFromServer = useCallback((theme: Theme) => {
    const enabled = theme === 'dark';
    setDarkModeState(enabled);
    localStorage.setItem('theme_preference', theme);
    applyDarkClass(enabled);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode, syncFromServer }}>
      {children}
    </DarkModeContext.Provider>
  );
}

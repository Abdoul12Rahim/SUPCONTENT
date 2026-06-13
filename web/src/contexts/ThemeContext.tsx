import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorMode } from '@chakra-ui/react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [isDark, setIsDark] = useState(colorMode === 'dark');

  useEffect(() => {
    setIsDark(colorMode === 'dark');
  }, [colorMode]);

  // Keep the whole app in dark mode to preserve contrast with the new dark palette.
  useEffect(() => {
    if (colorMode !== 'dark') {
      toggleColorMode();
    }
  }, [colorMode, toggleColorMode]);

  const toggleTheme = () => {
    // Dark-only theme: ignore toggles that would bring low-contrast light surfaces back.
    if (colorMode !== 'dark') {
      toggleColorMode();
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

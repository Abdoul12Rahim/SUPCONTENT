import React, { createContext, useContext, ReactNode } from 'react';
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

  return (
    <ThemeContext.Provider value={{ isDark: colorMode === 'dark', toggleTheme: toggleColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
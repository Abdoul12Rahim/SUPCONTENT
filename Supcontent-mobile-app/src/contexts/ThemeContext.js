import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

// Palette calquée sur le site web (Chakra UI gray.50 / blue)
export const colors = {
  primary: '#3182CE',     // blue.500 Chakra
  secondary: '#2C5282',   // blue.800
  background: '#F7FAFC',  // gray.50
  backgroundDark: '#1A202C',
  card: '#FFFFFF',
  cardDark: '#2D3748',
  text: '#1A202C',        // gray.800
  textLight: '#718096',   // gray.500
  textDark: '#F7FAFC',
  border: '#E2E8F0',      // gray.200
  success: '#38A169',
  error: '#E53E3E',
  warning: '#D69E2E',
  star: '#F6AD55',        // orange.300
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark((v) => !v);

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      ...colors,
      bg: isDark ? colors.backgroundDark : colors.background,
      card: isDark ? colors.cardDark : colors.card,
      text: isDark ? colors.textDark : colors.text,
    },
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

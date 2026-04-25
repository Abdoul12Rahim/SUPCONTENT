import React, { createContext, useState } from 'react';

// 1. On crée le contexte
export const AuthContext = createContext();

// 2. On crée le "Provider" (le distributeur)
export function AuthProvider({ children }) {
  // Par défaut, tout le monde commence en "Mode Invité" (false)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fonctions pour changer l'état
  const login = () => setIsLoggedIn(true);
  const logout = () => setIsLoggedIn(false);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
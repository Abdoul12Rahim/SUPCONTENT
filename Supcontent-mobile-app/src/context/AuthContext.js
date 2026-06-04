import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUserToken(token);
        // Récupère les infos utilisateur depuis le backend
        try {
          const response = await authAPI.getMe();
          setUser(response.data);
          setIsLoggedIn(true);
        } catch (e) {
          // Token expiré ou invalide → déconnecte proprement
          console.log('Token invalide, déconnexion:', e.message);
          await AsyncStorage.removeItem('userToken');
          setUserToken(null);
          setIsLoggedIn(false);
        }
      }
    } catch (e) {
      console.log('Erreur checkToken:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      // Backend renvoie { user, token }
      const { token, user: userData } = response.data;
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      setUser(userData);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Email ou mot de passe incorrect';
      return { success: false, message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register({ username, email, password });
      // Backend renvoie { user, token }
      const { token, user: userData } = response.data;
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      setUser(userData);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Erreur lors de l'inscription";
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
    } catch (e) {
      console.log('Erreur suppression token:', e);
    } finally {
      setUserToken(null);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider value={{
      user,           // { _id, username, email, displayName, avatar, bio, ... }
      userToken,
      isLoggedIn,
      isAuthenticated: isLoggedIn,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
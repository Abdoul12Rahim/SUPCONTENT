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
        // Charge d'abord le cache local pour affichage immédiat
        try {
          const cached = await AsyncStorage.getItem('userData');
          if (cached) setUser(JSON.parse(cached));
        } catch (e) {}

        // Puis recharge depuis le backend
        try {
          const response = await authAPI.getMe();
          const freshUser = response.data;
          setUser(freshUser);
          setIsLoggedIn(true);
          await AsyncStorage.setItem('userData', JSON.stringify(freshUser));
        } catch (e) {
          console.log('Token invalide:', e.message);
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          setUserToken(null);
          setUser(null);
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
      const { token, user: userData } = response.data;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUserToken(token);
      setUser(userData);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Email ou mot de passe incorrect',
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register({ username, email, password });
      const { token, user: userData } = response.data;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUserToken(token);
      setUser(userData);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Erreur lors de l'inscription",
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (e) {
      console.log('Erreur logout:', e);
    } finally {
      setUserToken(null);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const updateUser = async (userData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (e) {
      console.log('Erreur persist updateUser:', e.message);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
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
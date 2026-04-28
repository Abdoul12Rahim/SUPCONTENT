import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api'; 

export const AuthContext = createContext();
// Ce composant va envelopper toute l'app et fournir les infos de connexion à tous les composants enfants
export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUserToken(token);
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.log('Erreur AsyncStorage (checkToken):', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkToken();
  }, []);

 
  const login = async (email, password) => {
    try {
     
      const response = await authAPI.login({ email, password });
      
      
      const token = response.data.token; 
      
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      setIsLoggedIn(true);
      
      return { success: true };
    } catch (error) {
      console.error("Erreur de connexion :", error.response?.data || error.message);
      return { success: false, message: "Email ou mot de passe incorrect" };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
      setIsLoggedIn(false);
    } catch (e) {
      console.log('Erreur suppression token', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
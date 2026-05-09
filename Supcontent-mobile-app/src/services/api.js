import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ce fichier centralise toutes les interactions avec backend.
const API_URL = 'http://192.168.1.57:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter le Token JWT avant chaque requête
api.interceptors.request.use(
  async (config) => {
    try {
      
      const token = await AsyncStorage.getItem('userToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Erreur lors de la récupération du token', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Services API 
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};
// Services pour les contenus (jeux, vidéos, etc.)
export const contentAPI = {
  getPopular: (page = 1) => api.get(`/content/popular?page=${page}`),
  getGameDetails: (id) => api.get(`/content/${id}`),
  getNew: (page = 1) => api.get(`/content/new?page=${page}`),
  search: (query) => api.get(`/content/search?q=${query}`),
};
export const dealsAPI = {
  getTopDeals: () => axios.get('https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=20&sortBy=Deal Rating')
};

export default api;
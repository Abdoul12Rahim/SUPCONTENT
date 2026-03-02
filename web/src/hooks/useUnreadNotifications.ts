import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

export const useUnreadNotifications = () => {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications non lues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [isAuthenticated]);

  // Écouter les nouvelles notifications en temps réel
  useEffect(() => {
    if (socket && isAuthenticated) {
      const handleNewNotification = () => {
        // Incrémenter localement le compteur
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('new_notification', handleNewNotification);

      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [socket, isAuthenticated]);

  // Fonction pour décrémenter le compteur localement
  const decrementCount = (amount: number = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - amount));
  };

  return { 
    unreadCount, 
    loading, 
    refetch: fetchUnreadCount, 
    decrementCount 
  };
};

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

export const useUnreadMessages = () => {
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
      const response = await api.get('/messages/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Erreur lors du chargement des messages non lus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [isAuthenticated]);

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (socket && isAuthenticated) {
      const handleNewMessage = (data: { conversationId: string; message: any }) => {
        // Incrémenter localement le compteur
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.off('new_message', handleNewMessage);
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

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

const UNREAD_MESSAGES_KEY = 'unreadMessagesCount';
const UNREAD_MESSAGES_EVENT = 'unread-messages-updated';

export const useUnreadMessages = () => {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    const saved = localStorage.getItem(UNREAD_MESSAGES_KEY);
    const parsed = saved ? Number(saved) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const [loading, setLoading] = useState(true);

  const setAndBroadcastCount = (count: number) => {
    const next = Math.max(0, count);
    setUnreadCount(next);
    localStorage.setItem(UNREAD_MESSAGES_KEY, String(next));
    window.dispatchEvent(new CustomEvent<number>(UNREAD_MESSAGES_EVENT, { detail: next }));
  };

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) {
      setAndBroadcastCount(0);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/messages/unread-count');
      setAndBroadcastCount(response.data.count || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des messages non lus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleUnreadEvent = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      const next = Number(customEvent.detail);
      if (Number.isFinite(next)) {
        setUnreadCount(Math.max(0, next));
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== UNREAD_MESSAGES_KEY || event.newValue === null) return;
      const next = Number(event.newValue);
      if (Number.isFinite(next)) {
        setUnreadCount(Math.max(0, next));
      }
    };

    window.addEventListener(UNREAD_MESSAGES_EVENT, handleUnreadEvent as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(UNREAD_MESSAGES_EVENT, handleUnreadEvent as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (socket && isAuthenticated) {
      const handleNewMessage = async () => {
        // Resync serveur pour éviter les desynchronisations entre onglets/composants.
        try {
          const response = await api.get('/messages/unread-count');
          setAndBroadcastCount(response.data.count || 0);
        } catch (error) {
          console.error('Erreur sync messages non lus:', error);
        }
      };

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket, isAuthenticated]);

  // Fonction pour décrémenter le compteur localement
  const decrementCount = (amount: number = 1) => {
    setAndBroadcastCount(unreadCount - amount);
  };

  return { 
    unreadCount, 
    loading, 
    refetch: fetchUnreadCount, 
    decrementCount 
  };
};

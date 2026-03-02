import { useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Achievement } from '../services/achievementService';

export const useAchievementNotifications = () => {
  const { socket } = useSocket();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleAchievementUnlocked = (achievement: Achievement) => {
      // Toast de célébration
      toast({
        title: '🎉 Achievement Débloqué !',
        description: (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '24px' }}>{achievement.icon}</span>
              <span style={{ fontWeight: 'bold' }}>{achievement.name}</span>
            </div>
            <div style={{ fontSize: '14px' }}>{achievement.description}</div>
            <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
              +{achievement.points} points
            </div>
          </div>
        ),
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });

      // Effet sonore (optionnel - peut être ajouté plus tard)
      // new Audio('/sounds/achievement.mp3').play().catch(() => {});
    };

    socket.on('achievement_unlocked', handleAchievementUnlocked);

    return () => {
      socket.off('achievement_unlocked', handleAchievementUnlocked);
    };
  }, [socket, isAuthenticated, toast]);
};

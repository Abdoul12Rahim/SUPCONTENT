import api from './api';

export interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: 'collection' | 'review' | 'social' | 'special';
  condition: {
    type: 'count' | 'milestone' | 'action';
    target: string;
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isSecret: boolean;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  achievement: Achievement;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedCount: number;
  totalPoints: number;
  completionRate: number;
}

export const achievementService = {
  // Récupérer tous les achievements
  getAllAchievements: async (): Promise<Achievement[]> => {
    const response = await api.get('/achievements');
    return response.data;
  },

  // Récupérer les achievements d'un utilisateur
  getUserAchievements: async (userId: string): Promise<UserAchievement[]> => {
    const response = await api.get(`/achievements/user/${userId}`);
    return response.data;
  },

  // Récupérer mes achievements
  getMyAchievements: async (): Promise<UserAchievement[]> => {
    const response = await api.get('/achievements/my');
    return response.data;
  },

  // Vérifier et débloquer les achievements
  checkAchievements: async (): Promise<{ newlyUnlocked: Achievement[]; count: number }> => {
    const response = await api.post('/achievements/check');
    return response.data;
  },

  // Récupérer les statistiques
  getMyStats: async (): Promise<AchievementStats> => {
    const response = await api.get('/achievements/my/stats');
    return response.data;
  },

  getUserStats: async (userId: string): Promise<AchievementStats> => {
    const response = await api.get(`/achievements/stats/${userId}`);
    return response.data;
  },

  // Initialiser les achievements (admin)
  initializeAchievements: async (): Promise<void> => {
    await api.post('/achievements/initialize');
  },
};

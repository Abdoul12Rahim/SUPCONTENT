import api from './api';

export const notificationAPI = {
  getAll: async (page = 1) => {
    return api.get(`/notifications?page=${page}`);
  },

  getUnreadCount: async () => {
    return api.get('/notifications/unread-count');
  },

  markAsRead: async (notificationId: string) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    return api.put('/notifications/read-all');
  },
};

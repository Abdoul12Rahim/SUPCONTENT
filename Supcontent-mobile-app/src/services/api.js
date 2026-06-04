import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = __DEV__
  ? 'http://192.168.1.72:5000/api'
  : 'https://supcontent-backend.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Injecte le token JWT automatiquement
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Erreur token interceptor:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── AUTH ──────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  // data = { username, email, password }
  login: (data) => api.post('/auth/login', data),
  // data = { email, password }
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  // data = { displayName, bio, website, avatar, theme, language, emailNotifications, pushNotifications }
  changePassword: (data) => api.put('/auth/change-password', data),
  // data = { currentPassword, newPassword }
};

// ── CONTENT (RAWG via backend) ─────────────────
export const contentAPI = {
  getPopular: (page = 1) => api.get(`/content/popular?page=${page}`),
  getNewReleases: (page = 1) => api.get(`/content/new?page=${page}`),
  getGamesByPlatform: (platformId) => api.get(`/content/platform/${platformId}`),
  getHallOfFame: () => api.get('/content/halloffame'),
  getGameDetails: (id) => api.get(`/content/${id}`),
  search: (query) => api.get(`/content/search?q=${query}`),
  getUpcoming: () => api.get('/content/upcoming'),
  getHeadlines: () => api.get('/content/headlines'),
};

// ── LIBRARY ───────────────────────────────────
export const libraryAPI = {
  getMyLibrary: () => api.get('/library/my'),
  addGame: (data) => api.post('/library', data),
  // data = { contentId, status } — status: 'playing'|'completed'|'wishlist'|'dropped'
  checkInLibrary: (contentId) => api.get(`/library/check/${contentId}`),
  removeGame: (contentId) => api.delete(`/library/${contentId}`),
};

// ── REVIEWS ───────────────────────────────────
export const reviewAPI = {
  getByGame: (contentId) => api.get(`/reviews/game/${contentId}`),
  getByUser: (userId) => api.get(`/reviews/user/${userId}`),
  getMyReviewForGame: (contentId) => api.get(`/reviews/my-review/${contentId}`),
  getRecent: () => api.get('/reviews/recent'),
  getById: (reviewId) => api.get(`/reviews/${reviewId}`),
  create: (data) => api.post('/reviews', data),
  // data = { contentId, rating, text }
  like: (reviewId) => api.post(`/reviews/${reviewId}/like`),
  addComment: (reviewId, data) => api.post(`/reviews/${reviewId}/comment`, data),
  // data = { text }
  getComments: (reviewId) => api.get(`/reviews/${reviewId}/comments`),
  updateComment: (commentId, data) => api.put(`/reviews/comment/${commentId}`, data),
  deleteComment: (commentId) => api.delete(`/reviews/comment/${commentId}`),
  report: (reviewId, data) => api.post(`/reviews/${reviewId}/report`, data),
};

// ── USERS ─────────────────────────────────────
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  getByUsername: (username) => api.get(`/users/username/${username}`),
  getStats: (userId) => api.get(`/users/${userId}/stats`),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  exportData: () => api.get('/users/export/data'),
};

// ── SOCIAL ────────────────────────────────────
export const socialAPI = {
  // Events & Rooms (mock-ready, bascule sur backend si dispo)
  getActiveRooms: () => api.get('/rooms/active'),
  getEvents: async () => {
    try {
      const liveRes = await api.get('/events/live');
      if (liveRes.data && liveRes.data.length > 0) return liveRes;
      return await api.get('/content/upcoming');
    } catch {
      return await api.get('/content/upcoming');
    }
  },
  // Follow
  followUser: (userId) => api.post(`/social/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/social/follow/${userId}`),
  getFollowers: (userId) => api.get(`/social/followers/${userId}`),
  getFollowing: (userId) => api.get(`/social/following/${userId}`),
  searchUsers: (query) => api.get(`/social/search?q=${query}`),
  getFeed: () => api.get('/social/feed'),
};

// ── MESSAGES ──────────────────────────────────
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (userId) => api.get(`/messages/conversations/with/${userId}`),
  getMessages: (conversationId) => api.get(`/messages/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, data) => api.post(`/messages/conversations/${conversationId}/messages`, data),
  // data = { content, type } — type: 'text'|'voice'|'gif'
  markAsRead: (conversationId) => api.put(`/messages/conversations/${conversationId}/read`),
  deleteConversation: (conversationId) => api.delete(`/messages/conversations/${conversationId}`),
  deleteMessage: (messageId) => api.delete(`/messages/messages/${messageId}`),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

// ── NOTIFICATIONS ─────────────────────────────
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAsUnread: (id) => api.put(`/notifications/${id}/unread`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ── DEALS (externe CheapShark) ────────────────
export const dealsAPI = {
  getTopDeals: () => axios.get('https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=20&sortBy=Deal Rating'),
};

// ── LISTS ─────────────────────────────────────
export const listAPI = {
  create: (data) => api.post('/lists', data),
  getMyLists: () => api.get('/lists'),
  getList: (listId) => api.get(`/lists/${listId}`),
  update: (listId, data) => api.put(`/lists/${listId}`, data),
  delete: (listId) => api.delete(`/lists/${listId}`),
  addItem: (listId, data) => api.post(`/lists/${listId}/items`, data),
  removeItem: (listId, itemId) => api.delete(`/lists/${listId}/items/${itemId}`),
};

// ── LISTES COLLABORATIVES ─────────────────────
export const collabListAPI = {
  getPublic: () => api.get('/collaborative-lists/public'),
  getMyLists: () => api.get('/collaborative-lists'),
  getList: (listId) => api.get(`/collaborative-lists/${listId}`),
  create: (data) => api.post('/collaborative-lists', data),
  update: (listId, data) => api.put(`/collaborative-lists/${listId}`, data),
  delete: (listId) => api.delete(`/collaborative-lists/${listId}`),
  joinByCode: (inviteCode) => api.get(`/collaborative-lists/join/${inviteCode}`),
  joinPublic: (listId) => api.post(`/collaborative-lists/${listId}/join`),
  regenerateCode: (listId) => api.post(`/collaborative-lists/${listId}/regenerate-code`),
  addMember: (listId, data) => api.post(`/collaborative-lists/${listId}/members`, data),
  removeMember: (listId, userId) => api.delete(`/collaborative-lists/${listId}/members/${userId}`),
  updateMemberRole: (listId, userId, data) => api.put(`/collaborative-lists/${listId}/members/${userId}/role`, data),
  addItem: (listId, data) => api.post(`/collaborative-lists/${listId}/items`, data),
  removeItem: (listId, itemId) => api.delete(`/collaborative-lists/${listId}/items/${itemId}`),
};

export const newsAPI = {
  getHeadlines: () => api.get('/content/headlines'),
};

export default api;
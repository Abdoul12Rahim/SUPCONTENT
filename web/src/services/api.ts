import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Types
interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateProfileData {
  username?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  website?: string;
  theme?: 'light' | 'dark';
  language?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Services API
export const authAPI = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: UpdateProfileData) => api.put('/auth/profile', data),
  changePassword: (data: ChangePasswordData) => api.put('/auth/change-password', data),
};

export const contentAPI = {
  search: (query: string, page = 1, ordering?: string, genres?: string) => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      ...(ordering && { ordering }),
      ...(genres && { genres }),
    });
    return api.get(`/content/search?${params.toString()}`);
  },
  getById: (id: string) => api.get(`/content/${id}`),
  getBySlug: (slug: string) => api.get(`/content/slug/${slug}`),
  getPopular: (page = 1) => api.get(`/content/popular?page=${page}`),
  getNew: (page = 1) => api.get(`/content/new?page=${page}`),
};

interface CreateReviewData {
  contentId: string;
  rating: number;
  text: string;
  spoiler?: boolean;
}

export const reviewAPI = {
  create: (data: CreateReviewData) => api.post('/reviews', data),
  getById: (reviewId: string) => api.get(`/reviews/${reviewId}`),
  getByGame: (contentId: string, page = 1) => api.get(`/reviews/game/${contentId}?page=${page}`),
  getMyReview: (contentId: string) => api.get(`/reviews/my-review/${contentId}`),
  like: (reviewId: string) => api.post(`/reviews/${reviewId}/like`),
  addComment: (reviewId: string, text: string, parentCommentId?: string) => 
    api.post(`/reviews/${reviewId}/comment`, { text, parentCommentId }),
  getComments: (reviewId: string) => api.get(`/reviews/${reviewId}/comments`),
  updateComment: (commentId: string, text: string) => api.put(`/reviews/comment/${commentId}`, { text }),
  deleteComment: (commentId: string) => api.delete(`/reviews/comment/${commentId}`),
  report: (reviewId: string, reason: string) => api.post(`/reviews/${reviewId}/report`, { reason }),
};

interface AddToLibraryData {
  contentId: string;
  status: 'to_play' | 'playing' | 'completed' | 'dropped';
  rating?: number;
  hoursPlayed?: number;
  notes?: string;
}

export const libraryAPI = {
  add: (data: AddToLibraryData) => api.post('/library', data),
  getMy: (status?: string, page = 1) => api.get(`/library/my?status=${status || ''}&page=${page}`),
  check: (contentId: string) => api.get(`/library/check/${contentId}`),
  remove: (contentId: string) => api.delete(`/library/${contentId}`),
};

export const socialAPI = {
  follow: (userId: string) => api.post(`/social/follow/${userId}`),
  unfollow: (userId: string) => api.delete(`/social/follow/${userId}`),
  getFollowers: (userId: string, page = 1) => api.get(`/social/followers/${userId}?page=${page}`),
  getFollowing: (userId: string, page = 1) => api.get(`/social/following/${userId}?page=${page}`),
  getFeed: (page = 1) => api.get(`/social/feed?page=${page}`),
  searchUsers: (query: string, page = 1) => api.get(`/social/search?q=${query}&page=${page}`),
};

export const notificationAPI = {
  getAll: (page = 1) => api.get(`/notifications?page=${page}`),
  markAsRead: (notificationId: string) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

interface CreateCollaborativeListData {
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
  tags?: string[];
}

interface AddMemberData {
  userId: string;
  role?: 'editor' | 'viewer';
}

interface AddItemData {
  contentId: string;
  note?: string;
}

export const collaborativeListAPI = {
  // Gestion des listes
  create: (data: CreateCollaborativeListData) => api.post('/collaborative-lists', data),
  getMyLists: () => api.get('/collaborative-lists'),
  getList: (listId: string) => api.get(`/collaborative-lists/${listId}`),
  updateList: (listId: string, data: Partial<CreateCollaborativeListData>) => 
    api.put(`/collaborative-lists/${listId}`, data),
  deleteList: (listId: string) => api.delete(`/collaborative-lists/${listId}`),
  
  // Listes publiques
  getPublicLists: (page = 1, search?: string) => 
    api.get(`/collaborative-lists/public?page=${page}${search ? `&search=${search}` : ''}`),
  
  // Gestion des membres
  addMember: (listId: string, data: AddMemberData) => 
    api.post(`/collaborative-lists/${listId}/members`, data),
  removeMember: (listId: string, userId: string) => 
    api.delete(`/collaborative-lists/${listId}/members/${userId}`),
  updateMemberRole: (listId: string, userId: string, role: 'editor' | 'viewer') => 
    api.put(`/collaborative-lists/${listId}/members/${userId}/role`, { role }),
  
  // Rejoindre une liste
  joinListByCode: (inviteCode: string) => 
    api.get(`/collaborative-lists/join/${inviteCode}`),
  joinListPublic: (listId: string) => 
    api.post(`/collaborative-lists/${listId}/join`),
  regenerateInviteCode: (listId: string) => 
    api.post(`/collaborative-lists/${listId}/regenerate-code`),
  
  // Gestion des items
  addItem: (listId: string, data: AddItemData) => 
    api.post(`/collaborative-lists/${listId}/items`, data),
  removeItem: (listId: string, itemId: string) => 
    api.delete(`/collaborative-lists/${listId}/items/${itemId}`),
};

interface CreateListData {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export const listAPI = {
  // Gestion des listes personnelles
  create: (data: CreateListData) => api.post('/lists', data),
  getMyLists: () => api.get('/lists'),
  getList: (listId: string) => api.get(`/lists/${listId}`),
  updateList: (listId: string, data: Partial<CreateListData>) => 
    api.put(`/lists/${listId}`, data),
  deleteList: (listId: string) => api.delete(`/lists/${listId}`),
  
  // Gestion des items
  addItem: (listId: string, contentId: string) => 
    api.post(`/lists/${listId}/items`, { contentId }),
  removeItem: (listId: string, itemId: string) => 
    api.delete(`/lists/${listId}/items/${itemId}`),
};

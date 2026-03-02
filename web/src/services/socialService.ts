import api from './api';

export const socialAPI = {
  followUser: async (userId: string) => {
    return api.post(`/social/follow/${userId}`);
  },

  unfollowUser: async (userId: string) => {
    return api.post(`/social/unfollow/${userId}`);
  },

  getFollowers: async (userId: string, page = 1) => {
    return api.get(`/social/${userId}/followers?page=${page}`);
  },

  getFollowing: async (userId: string, page = 1) => {
    return api.get(`/social/${userId}/following?page=${page}`);
  },

  getFeed: async (page = 1, limit = 20) => {
    return api.get(`/social/feed?page=${page}&limit=${limit}`);
  },

  checkFollowStatus: async (userId: string) => {
    return api.get(`/social/follow-status/${userId}`);
  },

  checkIfFollowsMe: async (userId: string) => {
    return api.get(`/social/follows-me/${userId}`);
  },
};

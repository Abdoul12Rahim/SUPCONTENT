export const API_CONFIG = {
  RAWG: {
    BASE_URL: process.env.RAWG_API_URL || 'https://api.rawg.io/api',
    API_KEY: process.env.RAWG_API_KEY,
  },
  CACHE: {
    TTL: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 heure par défaut
  },
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};


/**
 * Génère l'URL complète pour un avatar
 * @param avatar - Chemin de l'avatar (peut être une URL externe ou un chemin local)
 * @returns URL complète de l'avatar
 */
export const getAvatarUrl = (avatar?: string): string | undefined => {
  if (!avatar) return undefined;
  
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }

  // Build a stable origin even when VITE_API_URL ends with /api
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const origin = apiUrl.replace(/\/api\/?$/, '');

  // Normalize paths so both /uploads/... and /api/uploads/... work
  let avatarPath = avatar.startsWith('/') ? avatar : `/${avatar}`;
  if (avatarPath.startsWith('/api/uploads/')) {
    avatarPath = avatarPath.replace('/api/uploads/', '/uploads/');
  }

  return `${origin}${avatarPath}`;
};

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
  
  // Sinon, c'est un chemin local, ajouter l'URL de base de l'API
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Si le chemin commence déjà par /, l'utiliser tel quel
  const avatarPath = avatar.startsWith('/') ? avatar : `/${avatar}`;
  
  return `${apiUrl}${avatarPath}`;
};

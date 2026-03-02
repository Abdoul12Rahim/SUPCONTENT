export const translations = {
  fr: {
    // Header/Navigation
    home: 'Accueil',
    games: 'Jeux',
    myLibrary: 'Ma Bibliothèque',
    feed: 'Fil d\'actualité',
    profile: 'Mon Profil',
    settings: 'Paramètres',
    login: 'Connexion',
    register: 'S\'inscrire',
    logout: 'Déconnexion',

    // Game Status
    playing: 'En cours',
    completed: 'Terminé',
    toPlay: 'À jouer',
    dropped: 'Abandonné',

    // Actions
    add: 'Ajouter',
    remove: 'Retirer',
    search: 'Rechercher',
    save: 'Enregistrer',
    cancel: 'Annuler',
    submit: 'Soumettre',
    
    // Library
    libraryTitle: 'Ma Bibliothèque',
    noGames: 'Aucun jeu dans cette catégorie',
    
    // Reviews
    writeReview: 'Écrire un avis',
    rating: 'Note',
    yourReview: 'Votre avis',
    publish: 'Publier',
    helpful: 'Utile',
    noReviews: 'Aucun avis pour le moment',
    beFirst: 'Soyez le premier à partager votre avis !',
    
    // Profile
    followers: 'Abonnés',
    following: 'Abonnements',
    gamesInLibrary: 'Jeux dans la bibliothèque',
    reviewsWritten: 'Avis écrits',
    
    // Common
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
  },
  
  en: {
    // Header/Navigation
    home: 'Home',
    games: 'Games',
    myLibrary: 'My Library',
    feed: 'Feed',
    profile: 'My Profile',
    settings: 'Settings',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',

    // Game Status
    playing: 'Playing',
    completed: 'Completed',
    toPlay: 'To Play',
    dropped: 'Dropped',

    // Actions
    add: 'Add',
    remove: 'Remove',
    search: 'Search',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    
    // Library
    libraryTitle: 'My Library',
    noGames: 'No games in this category',
    
    // Reviews
    writeReview: 'Write a Review',
    rating: 'Rating',
    yourReview: 'Your Review',
    publish: 'Publish',
    helpful: 'Helpful',
    noReviews: 'No reviews yet',
    beFirst: 'Be the first to share your review!',
    
    // Profile
    followers: 'Followers',
    following: 'Following',
    gamesInLibrary: 'Games in Library',
    reviewsWritten: 'Reviews Written',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  
  es: {
    // Header/Navigation
    home: 'Inicio',
    games: 'Juegos',
    myLibrary: 'Mi Biblioteca',
    feed: 'Feed',
    profile: 'Mi Perfil',
    settings: 'Configuración',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',

    // Game Status
    playing: 'Jugando',
    completed: 'Completado',
    toPlay: 'Por Jugar',
    dropped: 'Abandonado',

    // Actions
    add: 'Agregar',
    remove: 'Eliminar',
    search: 'Buscar',
    save: 'Guardar',
    cancel: 'Cancelar',
    submit: 'Enviar',
    
    // Library
    libraryTitle: 'Mi Biblioteca',
    noGames: 'No hay juegos en esta categoría',
    
    // Reviews
    writeReview: 'Escribir Reseña',
    rating: 'Calificación',
    yourReview: 'Tu Reseña',
    publish: 'Publicar',
    helpful: 'Útil',
    noReviews: 'Aún no hay reseñas',
    beFirst: '¡Sé el primero en compartir tu reseña!',
    
    // Profile
    followers: 'Seguidores',
    following: 'Siguiendo',
    gamesInLibrary: 'Juegos en la Biblioteca',
    reviewsWritten: 'Reseñas Escritas',
    
    // Common
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.fr;

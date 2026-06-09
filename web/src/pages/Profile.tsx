import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  Avatar, 
  HStack,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Divider,
  useToast,
  IconButton,
  Tooltip,
  Input,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Flex,
  Center
} from '@chakra-ui/react';
import { EditIcon, CalendarIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { libraryAPI, reviewAPI } from '../services/api';
import { socialAPI } from '../services/socialService';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserListModal } from '../components/Social/UserListModal';
import { getAvatarUrl } from '../utils/avatar';
import { GameCard } from '../components/Content/GameCard';
import { Loading } from '../components/Common/Loading';
import { AchievementsSection } from '../components/Profile/AchievementsSection';
import { useColorModeValue } from '@chakra-ui/react';

interface UserStats {
  libraryCount: number;
  reviewCount: number;
  followersCount: number;
  followingCount: number;
}

interface Review {
  _id: string;
  content: {
    _id: string;
    title: string;
    externalId: number;
    backgroundImage?: string;
    slug?: string;
  };
  rating: number;
  text: string;
  likes: number;
  createdAt: string;
}

interface LibraryGame {
  _id: string;
  content: {
    _id: string;
    externalId: number;
    slug: string;
    title: string;
    backgroundImage?: string;
    rating?: number;
    released?: string;
    genres?: string[];
    platforms?: string[];
  };
  status: string;
  rating?: number;
  hoursPlayed?: number;
}

interface GenreStat {
  name: string;
  count: number;
  color: string;
}

interface Activity {
  type: string;
  text: string;
  game: string;
  detail?: string;
  color: string;
  date?: string;
}

export const Profile = () => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>({ 
    libraryCount: 0, 
    reviewCount: 0,
    followersCount: 0,
    followingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const toast = useToast();
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [genreStats, setGenreStats] = useState<GenreStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [libraryGames, setLibraryGames] = useState<LibraryGame[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const cardBg = useColorModeValue('white', 'gray.800');
  const surfaceBg = useColorModeValue('gray.50', 'gray.900');
  const tabBg = useColorModeValue('gray.50', 'gray.700');
  const tabSelectedBg = useColorModeValue('white', 'gray.800');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const bodyText = useColorModeValue('gray.700', 'gray.200');

  // Rediriger vers l'accueil si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour accéder à votre profil',
        status: 'warning',
        duration: 3000,
      });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchStats();
      fetchReviews();
      fetchLibrary();
    }
  }, [isAuthenticated, user]);

  // Générer l'activité récente quand les données sont chargées
  useEffect(() => {
    if (libraryGames.length > 0 || reviews.length > 0) {
      generateRecentActivity();
    }
  }, [libraryGames, reviews]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      if (!user?._id) return;
      
      const response = await api.get(`/users/${user._id}/stats`);
      setStats(response.data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      if (!user?._id) return;
      
      const response = await api.get(`/reviews/user/${user._id}`);
      const reviewsData = response.data.reviews || response.data;
      setReviews(reviewsData);
      
      // Calculer la note moyenne
      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des critiques:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchLibrary = async () => {
    try {
      setLoadingLibrary(true);
      const response = await libraryAPI.getMy('', 1);
      const libraryData = response.data.items || response.data;
      setLibraryGames(libraryData);
      
      // Calculer les statistiques de genre
      calculateGenreStats(libraryData);
    } catch (error: any) {
      console.error('Erreur lors du chargement de la bibliothèque:', error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const calculateGenreStats = (library: LibraryGame[]) => {
    const genreCounts: { [key: string]: number } = {};
    
    library.forEach((item) => {
      item.content.genres?.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    
    const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'red', 'teal', 'cyan'];
    const stats = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => ({
        name,
        count,
        color: colors[index % colors.length]
      }));
    
    setGenreStats(stats);
  };

  const generateRecentActivity = () => {
    const activities: Activity[] = [];
    
    // Activités de jeux terminés récemment
    const completed = libraryGames
      .filter(item => item.status === 'completed')
      .slice(0, 2)
      .map(item => ({
        type: 'completed',
        text: 'A terminé',
        game: item.content.title,
        color: 'green'
      }));
    
    activities.push(...completed);
    
    // Activités de critiques récentes
    const recentReviews = reviews.slice(0, 2).map(review => ({
      type: 'reviewed',
      text: 'A publié une critique de',
      game: review.content.title,
      color: 'yellow'
    }));
    
    activities.push(...recentReviews);
    
    // Jeux ajoutés récemment
    const recentlyAdded = libraryGames
      .slice(0, 1)
      .map(item => ({
        type: 'added',
        text: 'A ajouté',
        game: item.content.title,
        detail: 'à sa collection',
        color: 'blue'
      }));
    
    activities.push(...recentlyAdded);
    
    setRecentActivity(activities.slice(0, 3));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'L\'image ne doit pas dépasser 5MB',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Mettre à jour l'utilisateur local avec le nouvel avatar
      if (updateUser && user?._id) {
        updateUser({ 
          ...user, 
          _id: user._id, 
          avatar: response.data.avatar 
        });
      }

      toast({
        title: 'Succès',
        description: 'Photo de profil mise à jour',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de mettre à jour la photo',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setUploadingAvatar(false);
      // Réinitialiser l'input pour permettre de sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Heading mb={4}>Profil</Heading>
          <Text>Veuillez vous connecter pour voir votre profil</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        {/* En-tête du profil */}
        <Box bg={cardBg} p={8} borderRadius="lg" shadow="sm" position="relative">
          <Button 
            position="absolute" 
            top={6} 
            right={6}
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
          >
            Modifier le profil
          </Button>
          
          <HStack spacing={6} align="start">
            <Box position="relative">
              <Avatar 
                size="2xl" 
                name={user.displayName || user.username}
                src={getAvatarUrl(user.avatar)}
              />
            </Box>
            <VStack align="start" flex={1} spacing={2}>
              <Heading size="lg">{user.displayName || user.username}</Heading>
              <Text color={mutedText}>{user.email}</Text>
              {user.bio && <Text color={bodyText} mt={2}>{user.bio}</Text>}
              
              <HStack spacing={6} pt={2} color="gray.700">
                <HStack 
                  spacing={2} 
                  cursor="pointer"
                  onClick={() => setModalType('followers')}
                  _hover={{ color: 'gray.900' }}
                >
                  <Text fontSize="sm">👥</Text>
                  <Text fontSize="sm" fontWeight="medium">{stats.followersCount} abonnés</Text>
                </HStack>
                <HStack 
                  spacing={2}
                  cursor="pointer"
                  onClick={() => setModalType('following')}
                  _hover={{ color: 'gray.900' }}
                >
                  <Text fontSize="sm">👤</Text>
                  <Text fontSize="sm" fontWeight="medium">{stats.followingCount} abonnements</Text>
                </HStack>
                <HStack spacing={2}>
                  <CalendarIcon fontSize="sm" />
                  <Text fontSize="sm" fontWeight="medium">Membre depuis 2024</Text>
                </HStack>
              </HStack>
            </VStack>
          </HStack>

          {/* Section des statistiques principales */}
          <HStack spacing={0} justify="center" mt={8} pt={6} borderTop="1px" borderColor={useColorModeValue('gray.200', 'gray.600')}>
            <Box textAlign="center" flex={1}>
              <Heading size="sm" color="gray.600" mb={1}>Critiques</Heading>
              <HStack justify="center" spacing={2}>
                <Heading size="2xl">{stats.reviewCount}</Heading>
                <Text fontSize="lg" color="gray.600" mt={2}>Jeux</Text>
              </HStack>
            </Box>
            <Box textAlign="center" flex={1}>
              <Heading size="sm" color="gray.600" mb={1}>Note moyenne</Heading>
              <Heading size="2xl">{averageRating.toFixed(1)}</Heading>
            </Box>
          </HStack>
        </Box>

        {/* Onglets */}
        <Tabs colorScheme="gray" variant="soft-rounded">
          <TabList bg={tabBg} p={2} borderRadius="lg">
            <Tab _selected={{ bg: tabSelectedBg, fontWeight: 'semibold' }}>
              Critiques ({stats.reviewCount})
            </Tab>
            <Tab _selected={{ bg: tabSelectedBg, fontWeight: 'semibold' }}>
              Collection ({stats.libraryCount})
            </Tab>
            <Tab _selected={{ bg: tabSelectedBg, fontWeight: 'semibold' }}>
              Achievements
            </Tab>
            <Tab _selected={{ bg: tabSelectedBg, fontWeight: 'semibold' }}>
              Statistiques
            </Tab>
          </TabList>

          <TabPanels>
            {/* Onglet Critiques */}
            <TabPanel px={0}>
              <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm" minH="300px">
                {loadingReviews ? (
                  <Center py={8}>
                    <Loading />
                  </Center>
                ) : reviews.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    {reviews.map((review) => (
                      <Box 
                        key={review._id}
                        p={4}
                        borderWidth="1px"
                        borderRadius="lg"
                        cursor="pointer"
                        _hover={{ shadow: 'md' }}
                        onClick={() => navigate(`/game/${review.content.slug || review.content.externalId}`)}
                      >
                        <HStack spacing={4} align="start">
                          {review.content.backgroundImage && (
                            <Box
                              w="100px"
                              h="60px"
                              borderRadius="md"
                              bgImage={`url(${review.content.backgroundImage})`}
                              bgSize="cover"
                              bgPosition="center"
                              flexShrink={0}
                            />
                          )}
                          <VStack align="start" flex={1} spacing={2}>
                            <HStack justify="space-between" w="full">
                              <Heading size="sm">{review.content.title}</Heading>
                              <HStack spacing={1}>
                                <Text fontWeight="bold" color="yellow.500">★</Text>
                                <Text fontWeight="bold">{review.rating}/5</Text>
                              </HStack>
                            </HStack>
                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                              {review.text}
                            </Text>
                            <HStack spacing={4} fontSize="xs" color="gray.500">
                              <Text>❤️ {review.likes} likes</Text>
                              <Text>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</Text>
                            </HStack>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Text fontSize="3xl">✍️</Text>
                      <Text color="gray.500">Aucune critique pour le moment</Text>
                      <Button 
                        size="sm" 
                        colorScheme="blue" 
                        variant="outline"
                        onClick={() => navigate('/games')}
                      >
                        Découvrir des jeux
                      </Button>
                    </VStack>
                  </Center>
                )}
              </Box>
            </TabPanel>

            {/* Onglet Collection */}
            <TabPanel px={0}>
              <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm" minH="300px">
                {loadingLibrary ? (
                  <Center py={8}>
                    <Loading />
                  </Center>
                ) : libraryGames.length > 0 ? (
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                    {libraryGames.map((item) => (
                      <GameCard
                        key={item._id}
                        id={String(item.content.externalId)}
                        slug={item.content.slug}
                        title={item.content.title}
                        image={item.content.backgroundImage}
                        rating={item.content.rating}
                        releaseDate={item.content.released}
                        genres={item.content.genres}
                        platforms={item.content.platforms}
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Text fontSize="3xl">📚</Text>
                      <Text color="gray.500">Votre collection est vide</Text>
                      <Button 
                        size="sm" 
                        colorScheme="blue" 
                        variant="outline"
                        onClick={() => navigate('/games')}
                      >
                        Ajouter des jeux
                      </Button>
                    </VStack>
                  </Center>
                )}
              </Box>
            </TabPanel>

            {/* Onglet Achievements */}
            <TabPanel px={0}>
              <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm" minH="300px">
                {user && <AchievementsSection userId={user._id} isOwnProfile={true} />}
              </Box>
            </TabPanel>

            {/* Onglet Statistiques */}
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Répartition par genre */}
                <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
                  <Heading size="md" mb={6}>Répartition par genre</Heading>
                  {genreStats.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {genreStats.map((genre) => {
                        const maxCount = Math.max(...genreStats.map(g => g.count));
                        const percentage = (genre.count / maxCount) * 100;
                        
                        return (
                          <Box key={genre.name}>
                            <Flex justify="space-between" mb={2}>
                              <Text fontWeight="medium">{genre.name}</Text>
                              <Text fontWeight="bold">{genre.count}</Text>
                            </Flex>
                            <Progress 
                              value={percentage} 
                              colorScheme={genre.color}
                              size="sm"
                              borderRadius="full"
                            />
                          </Box>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Center py={8}>
                      <VStack spacing={2}>
                        <Text fontSize="2xl">📊</Text>
                        <Text color="gray.500" fontSize="sm">Aucune donnée disponible</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>

                {/* Activité récente */}
                <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
                  <Heading size="md" mb={6}>Activité récente</Heading>
                  {recentActivity.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {recentActivity.map((activity, index) => (
                        <HStack key={index} spacing={3} align="start">
                          <Box 
                            w="8px" 
                            h="8px" 
                            borderRadius="full" 
                            bg={`${activity.color}.500`}
                            mt={1.5}
                            flexShrink={0}
                          />
                          <Text fontSize="sm">
                            {activity.text} <Text as="span" fontWeight="bold">{activity.game}</Text>
                            {activity.detail && ` ${activity.detail}`}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Center py={8}>
                      <VStack spacing={2}>
                        <Text fontSize="2xl">📝</Text>
                        <Text color="gray.500" fontSize="sm">Aucune activité récente</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Input caché pour upload avatar */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        display="none"
        onChange={handleFileChange}
      />

      {/* Modal pour followers/following */}
      {user && modalType && (
        <UserListModal
          isOpen={modalType !== null}
          onClose={() => {
            setModalType(null);
            fetchStats();
          }}
          userId={user._id}
          type={modalType}
          title={modalType === 'followers' ? 'Abonnés' : 'Abonnements'}
        />
      )}
    </Container>
  );
};

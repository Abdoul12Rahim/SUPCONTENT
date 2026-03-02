import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  Spinner, 
  HStack, 
  Avatar,
  Badge,
  Button,
  IconButton,
  Divider,
  useToast,
  Image,
  Flex,
  Link
} from '@chakra-ui/react';
import { StarIcon, ChatIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { socialAPI, reviewAPI } from '../services/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { CommentSection } from '../components/Content/CommentSection';
import { socialAPI as socialService } from '../services/socialService';
import { useSocket } from '../contexts/SocketContext';
import { getAvatarUrl } from '../utils/avatar';

interface Activity {
  _id: string;
  type: 'review' | 'library_add' | 'follow' | 'like' | 'comment';
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  content?: {
    _id: string;
    title: string;
    slug: string;
    backgroundImage?: string;
    externalId: number;
  };
  review?: {
    _id: string;
    rating: number;
    text: string;
    likes: number;
    createdAt: string;
  };
  targetUser?: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  comment?: {
    _id: string;
    text: string;
    user: {
      username: string;
      displayName?: string;
    };
  };
  metadata?: {
    rating?: number;
    status?: string;
    commentText?: string;
  };
  createdAt: string;
}

export const Feed = () => {
  const { isAuthenticated, user } = useAuth();
  const { socket } = useSocket();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await socialAPI.getFeed(page);
      const newActivities = response.data.activities || [];
      
      if (page === 1) {
        setActivities(newActivities);
      } else {
        setActivities((prev) => [...prev, ...newActivities]);
      }
      
      setHasMore(newActivities.length === 20);
    } catch (error: any) {
      console.error('Erreur lors du chargement du feed:', error);
      if (error.response?.status !== 401) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le fil d\'actualité',
          status: 'error',
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    }
  }, [isAuthenticated, page]);

  // Écouter les nouvelles activités en temps réel via Socket.io
  useEffect(() => {
    if (socket && isAuthenticated) {
      const handleNewActivity = () => {
        // Rafraîchir le feed quand il y a une nouvelle activité
        if (page === 1) {
          fetchFeed();
        }
      };

      socket.on('new_activity', handleNewActivity);

      return () => {
        socket.off('new_activity', handleNewActivity);
      };
    }
  }, [socket, isAuthenticated, page]);

  const handleLikeReview = async (reviewId: string) => {
    try {
      await reviewAPI.like(reviewId);
      // Rafraîchir le feed
      fetchFeed();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de liker l\'avis',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <StarIcon
          key={i}
          color={i < rating ? 'yellow.400' : 'gray.300'}
          boxSize={4}
        />
      ));
  };

  const renderActivity = (activity: Activity) => {
    const displayName = activity.user.displayName || activity.user.username;

    switch (activity.type) {
      case 'review':
        return (
          <Box key={activity._id} bg="white" p={6} borderRadius="lg" shadow="sm">
            <HStack spacing={4} align="start" mb={4}>
              <Avatar 
                size="md" 
                name={displayName}
                src={getAvatarUrl(activity.user.avatar)}
                cursor="pointer"
                onClick={() => navigate(`/profile/${activity.user._id}`)}
              />
              <VStack align="start" spacing={1} flex={1}>
                <HStack>
                  <Text 
                    fontWeight="bold"
                    cursor="pointer"
                    onClick={() => navigate(`/profile/${activity.user._id}`)}
                    _hover={{ color: 'blue.500' }}
                  >
                    {displayName}
                  </Text>
                  <Text color="gray.500" fontSize="sm">a écrit un avis</Text>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {formatTimeAgo(activity.createdAt)}
                </Text>
              </VStack>
            </HStack>

            {activity.content && (
              <HStack 
                spacing={4} 
                mb={4} 
                p={3} 
                bg="gray.50" 
                borderRadius="md"
                cursor="pointer"
                onClick={() => navigate(`/game/${activity.content!.externalId}`)}
                _hover={{ bg: 'gray.100' }}
              >
                {activity.content.backgroundImage && (
                  <Image
                    src={activity.content.backgroundImage}
                    alt={activity.content.title}
                    boxSize="60px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                )}
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold">{activity.content.title}</Text>
                  {activity.review && (
                    <HStack spacing={1}>
                      {renderStars(activity.review.rating)}
                    </HStack>
                  )}
                </VStack>
              </HStack>
            )}

            {activity.review && (
              <>
                <Text mb={4}>{activity.review.text}</Text>
                <HStack spacing={4}>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<StarIcon />}
                    onClick={() => handleLikeReview(activity.review!._id)}
                  >
                    {activity.review.likes} {t('helpful')}
                  </Button>
                  <CommentSection reviewId={activity.review._id} />
                </HStack>
              </>
            )}
          </Box>
        );

      case 'library_add':
        return (
          <Box key={activity._id} bg="white" p={6} borderRadius="lg" shadow="sm">
            <HStack spacing={4} align="center">
              <Avatar 
                size="md" 
                name={displayName}
                src={getAvatarUrl(activity.user.avatar)}
                cursor="pointer"
                onClick={() => navigate(`/profile/${activity.user._id}`)}
              />
              <VStack align="start" spacing={1} flex={1}>
                <HStack flexWrap="wrap">
                  <Text 
                    fontWeight="bold"
                    cursor="pointer"
                    onClick={() => navigate(`/profile/${activity.user._id}`)}
                    _hover={{ color: 'blue.500' }}
                  >
                    {displayName}
                  </Text>
                  <Text color="gray.500">a ajouté</Text>
                  {activity.content && (
                    <Link
                      fontWeight="semibold"
                      color="blue.500"
                      onClick={() => navigate(`/game/${activity.content!.externalId}`)}
                    >
                      {activity.content.title}
                    </Link>
                  )}
                  <Text color="gray.500">à sa bibliothèque</Text>
                  {activity.metadata?.status && (
                    <Badge colorScheme="blue">
                      {activity.metadata.status === 'playing' && 'En cours'}
                      {activity.metadata.status === 'completed' && 'Terminé'}
                      {activity.metadata.status === 'to_play' && 'À jouer'}
                      {activity.metadata.status === 'dropped' && 'Abandonné'}
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {formatTimeAgo(activity.createdAt)}
                </Text>
              </VStack>
              {activity.content?.backgroundImage && (
                <Image
                  src={activity.content.backgroundImage}
                  alt={activity.content.title}
                  boxSize="60px"
                  objectFit="cover"
                  borderRadius="md"
                />
              )}
            </HStack>
          </Box>
        );

      case 'follow':
        return (
          <Box key={activity._id} bg="white" p={6} borderRadius="lg" shadow="sm">
            <HStack spacing={4} align="center">
              <Avatar 
                size="md" 
                name={displayName}
                src={activity.user.avatar}
                cursor="pointer"
                onClick={() => navigate(`/profile/${activity.user._id}`)}
              />
              <VStack align="start" spacing={1} flex={1}>
                <HStack>
                  <Text 
                    fontWeight="bold"
                    cursor="pointer"
                    onClick={() => navigate(`/profile/${activity.user._id}`)}
                    _hover={{ color: 'blue.500' }}
                  >
                    {displayName}
                  </Text>
                  <Text color="gray.500">suit maintenant</Text>
                  {activity.targetUser && (
                    <>
                      <Avatar 
                        size="sm" 
                        name={activity.targetUser.displayName || activity.targetUser.username}
                        src={getAvatarUrl(activity.targetUser.avatar)}
                      />
                      <Text fontWeight="semibold">
                        {activity.targetUser.displayName || activity.targetUser.username}
                      </Text>
                    </>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {formatTimeAgo(activity.createdAt)}
                </Text>
              </VStack>
            </HStack>
          </Box>
        );

      case 'like':
        return (
          <Box key={activity._id} bg="white" p={6} borderRadius="lg" shadow="sm">
            <HStack spacing={4} align="start">
              <Avatar 
                size="md" 
                name={displayName}
                src={getAvatarUrl(activity.user.avatar)}
                cursor="pointer"
                onClick={() => navigate(`/profile/${activity.user._id}`)}
              />
              <VStack align="start" spacing={2} flex={1}>
                <HStack flexWrap="wrap">
                  <Text 
                    fontWeight="bold"
                    cursor="pointer"
                    onClick={() => navigate(`/profile/${activity.user._id}`)}
                    _hover={{ color: 'blue.500' }}
                  >
                    {displayName}
                  </Text>
                  <Text color="gray.500">a aimé une critique</Text>
                  {activity.targetUser && (
                    <>
                      <Text color="gray.500">de</Text>
                      <Text 
                        fontWeight="semibold"
                        cursor="pointer"
                        onClick={() => navigate(`/profile/${activity.targetUser!._id}`)}
                        _hover={{ color: 'blue.500' }}
                      >
                        {activity.targetUser.displayName || activity.targetUser.username}
                      </Text>
                    </>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {formatTimeAgo(activity.createdAt)}
                </Text>
                {activity.content && activity.review && (
                  <HStack 
                    spacing={4} 
                    p={3} 
                    bg="gray.50" 
                    borderRadius="md"
                    w="full"
                    cursor="pointer"
                    onClick={() => navigate(`/game/${activity.content!.externalId}`)}
                    _hover={{ bg: 'gray.100' }}
                  >
                    {activity.content.backgroundImage && (
                      <Image
                        src={activity.content.backgroundImage}
                        alt={activity.content.title}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold" fontSize="sm">{activity.content.title}</Text>
                      <HStack spacing={1}>
                        {renderStars(activity.review.rating)}
                      </HStack>
                    </VStack>
                  </HStack>
                )}
              </VStack>
            </HStack>
          </Box>
        );

      case 'comment':
        return (
          <Box key={activity._id} bg="white" p={6} borderRadius="lg" shadow="sm">
            <HStack spacing={4} align="start">
              <Avatar 
                size="md" 
                name={displayName}
                src={getAvatarUrl(activity.user.avatar)}
                cursor="pointer"
                onClick={() => navigate(`/profile/${activity.user._id}`)}
              />
              <VStack align="start" spacing={2} flex={1}>
                <HStack flexWrap="wrap">
                  <Text 
                    fontWeight="bold"
                    cursor="pointer"
                    onClick={() => navigate(`/profile/${activity.user._id}`)}
                    _hover={{ color: 'blue.500' }}
                  >
                    {displayName}
                  </Text>
                  <Text color="gray.500">a commenté la critique</Text>
                  {activity.targetUser && (
                    <>
                      <Text color="gray.500">de</Text>
                      <Text 
                        fontWeight="semibold"
                        cursor="pointer"
                        onClick={() => navigate(`/profile/${activity.targetUser!._id}`)}
                        _hover={{ color: 'blue.500' }}
                      >
                        {activity.targetUser.displayName || activity.targetUser.username}
                      </Text>
                    </>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {formatTimeAgo(activity.createdAt)}
                </Text>
                {activity.metadata?.commentText && (
                  <Box p={3} bg="gray.50" borderRadius="md" w="full">
                    <Text fontSize="sm" color="gray.700">
                      💬 "{activity.metadata.commentText}..."
                    </Text>
                  </Box>
                )}
                {activity.content && (
                  <HStack 
                    spacing={4} 
                    p={3} 
                    bg="blue.50" 
                    borderRadius="md"
                    w="full"
                    cursor="pointer"
                    onClick={() => navigate(`/game/${activity.content!.externalId}`)}
                    _hover={{ bg: 'blue.100' }}
                  >
                    {activity.content.backgroundImage && (
                      <Image
                        src={activity.content.backgroundImage}
                        alt={activity.content.title}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <Text fontWeight="semibold" fontSize="sm">{activity.content.title}</Text>
                  </HStack>
                )}
              </VStack>
            </HStack>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Heading mb={4}>Fil d'actualité</Heading>
          <Text>Veuillez vous connecter pour voir votre fil d'actualité</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading>Fil d'actualité</Heading>

        {/* Statistiques */}
        {!loading && activities.length > 0 && (
          <Box bg="white" p={4} borderRadius="lg" shadow="sm">
            <HStack spacing={6} flexWrap="wrap" justify="space-around">
              <VStack spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {activities.length}
                </Text>
                <Text fontSize="sm" color="gray.600">Activités</Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                  {activities.filter(a => a.type === 'review').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Critiques</Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {activities.filter(a => a.type === 'library_add').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Ajouts</Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">
                  {activities.filter(a => a.type === 'like').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Likes</Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {activities.filter(a => a.type === 'comment').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Commentaires</Text>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* Filtres */}
        <HStack spacing={2} flexWrap="wrap">
          <Button
            size="sm"
            colorScheme={filterType === 'all' ? 'blue' : 'gray'}
            variant={filterType === 'all' ? 'solid' : 'outline'}
            onClick={() => setFilterType('all')}
          >
            🌐 Tous
          </Button>
          <Button
            size="sm"
            colorScheme={filterType === 'review' ? 'blue' : 'gray'}
            variant={filterType === 'review' ? 'solid' : 'outline'}
            onClick={() => setFilterType('review')}
          >
            ⭐ Critiques
          </Button>
          <Button
            size="sm"
            colorScheme={filterType === 'library_add' ? 'blue' : 'gray'}
            variant={filterType === 'library_add' ? 'solid' : 'outline'}
            onClick={() => setFilterType('library_add')}
          >
            🎮 Ajouts
          </Button>
          <Button
            size="sm"
            colorScheme={filterType === 'like' ? 'blue' : 'gray'}
            variant={filterType === 'like' ? 'solid' : 'outline'}
            onClick={() => setFilterType('like')}
          >
            ❤️ Likes
          </Button>
          <Button
            size="sm"
            colorScheme={filterType === 'comment' ? 'blue' : 'gray'}
            variant={filterType === 'comment' ? 'solid' : 'outline'}
            onClick={() => setFilterType('comment')}
          >
            💬 Commentaires
          </Button>
          <Button
            size="sm"
            colorScheme={filterType === 'follow' ? 'blue' : 'gray'}
            variant={filterType === 'follow' ? 'solid' : 'outline'}
            onClick={() => setFilterType('follow')}
          >
            👥 Abonnements
          </Button>
        </HStack>

        {loading && page === 1 ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : activities.length === 0 ? (
          <Box p={12} bg="white" borderRadius="lg" shadow="sm" textAlign="center">
            <Text fontSize="lg" color="gray.500" mb={2}>
              👥 Aucune activité pour le moment
            </Text>
            <Text fontSize="sm" color="gray.400">
              Suivez d'autres utilisateurs pour voir leurs activités ici !
            </Text>
            <Button
              mt={4}
              colorScheme="blue"
              onClick={() => navigate('/games')}
            >
              Découvrir des jeux
            </Button>
          </Box>
        ) : (
          <>
            {activities
              .filter((activity) => filterType === 'all' || activity.type === filterType)
              .map((activity) => renderActivity(activity))}

            {hasMore && (
              <Button
                onClick={() => setPage((p) => p + 1)}
                isLoading={loading}
                variant="outline"
              >
                Charger plus
              </Button>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
};

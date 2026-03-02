import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Button,
  Spinner,
  Image,
  Flex,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { StarIcon, ChatIcon, RepeatIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { CommentSection } from '../components/Content/CommentSection';
import { socialAPI } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';

interface Review {
  _id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  content: {
    _id: string;
    title: string;
    externalId: number;
    backgroundImage?: string;
  };
  rating: number;
  text: string;
  likes: number;
  createdAt: string;
}

export const CommunityReviews = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reviews/recent?page=${page}&limit=20`);
      const newReviews = response.data.reviews || [];
      
      if (page === 1) {
        setReviews(newReviews);
      } else {
        setReviews((prev) => [...prev, ...newReviews]);
      }
      
      // Vérifier le statut de follow pour chaque utilisateur
      if (user) {
        const userIds = [...new Set(newReviews.map((r: Review) => r.user._id))] as string[];
        const followStatuses = await Promise.all(
          userIds.map(async (userId: string) => {
            try {
              const res = await socialAPI.checkFollowStatus(userId);
              return { userId, isFollowing: res.data.isFollowing };
            } catch {
              return { userId, isFollowing: false };
            }
          })
        );
        const following = new Set(followStatuses.filter(s => s.isFollowing).map(s => s.userId)) as Set<string>;
        setFollowingUsers(following);
      }
      
      setHasMore(newReviews.length === 20);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les avis',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  // Rafraîchir la liste quand on arrive sur la page
  useEffect(() => {
    if (page === 1) {
      handleRefresh();
    }
  }, [location.pathname]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    try {
      const response = await api.get(`/reviews/recent?page=1&limit=20`);
      const newReviews = response.data.reviews || [];
      setReviews(newReviews);
      
      if (user) {
        const userIds = [...new Set(newReviews.map((r: Review) => r.user._id))] as string[];
        const followStatuses = await Promise.all(
          userIds.map(async (userId: string) => {
            try {
              const res = await socialAPI.checkFollowStatus(userId);
              return { userId, isFollowing: res.data.isFollowing };
            } catch {
              return { userId, isFollowing: false };
            }
          })
        );
        const following = new Set(followStatuses.filter(s => s.isFollowing).map(s => s.userId)) as Set<string>;
        setFollowingUsers(following);
      }
      
      setHasMore(newReviews.length === 20);
      
      toast({
        title: 'Actualisé',
        description: 'La liste des avis a été actualisée',
        status: 'success',
        duration: 2000,
      });
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'actualiser les avis',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (reviewId: string) => {
    try {
      await api.post(`/reviews/${reviewId}/like`);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de liker l\'avis',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour suivre un utilisateur',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const isFollowing = followingUsers.has(userId);
      if (isFollowing) {
        await socialAPI.unfollowUser(userId);
        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast({
          title: 'Succès',
          description: 'Vous ne suivez plus cet utilisateur',
          status: 'success',
          duration: 2000,
        });
      } else {
        await socialAPI.followUser(userId);
        setFollowingUsers((prev) => new Set(prev).add(userId));
        toast({
          title: 'Succès',
          description: 'Vous suivez maintenant cet utilisateur',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de suivre l\'utilisateur',
        status: 'error',
        duration: 3000,
      });
    }
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

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading>Avis de la communauté</Heading>
          <Button
            leftIcon={<RepeatIcon />}
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
            loadingText="Actualisation..."
          >
            Actualiser
          </Button>
        </HStack>

        {loading && page === 1 ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : reviews.length === 0 ? (
          <Box p={12} bg="white" borderRadius="lg" shadow="sm" textAlign="center">
            <Text fontSize="lg" color="gray.500">
              📝 Aucun avis pour le moment
            </Text>
            <Text fontSize="sm" color="gray.400" mt={2}>
              Soyez le premier à écrire un avis !
            </Text>
          </Box>
        ) : (
          <>
            {reviews.map((review) => (
              <Box key={review._id} bg="white" p={6} borderRadius="lg" shadow="sm">
                <HStack spacing={4} align="start" mb={4}>
                  <Avatar
                    size="md"
                    name={review.user.displayName || review.user.username}
                    src={review.user.avatar}
                    cursor="pointer"
                    onClick={() => navigate(`/profile/${review.user._id}`)}
                  />
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack>
                      <Text 
                        fontWeight="bold"
                        cursor="pointer"
                        onClick={() => navigate(`/profile/${review.user._id}`)}
                        _hover={{ color: 'blue.500' }}
                      >
                        {review.user.displayName || review.user.username}
                      </Text>
                      <Text color="gray.500" fontSize="sm">
                        a écrit un avis
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {formatTimeAgo(review.createdAt)}
                    </Text>
                  </VStack>
                  {user && user._id !== review.user._id && (
                    <Button
                      size="sm"
                      colorScheme={followingUsers.has(review.user._id) ? 'gray' : 'blue'}
                      variant={followingUsers.has(review.user._id) ? 'outline' : 'solid'}
                      onClick={() => handleFollow(review.user._id)}
                    >
                      {followingUsers.has(review.user._id) ? 'Abonné' : 'S\'abonner'}
                    </Button>
                  )}
                </HStack>

                <HStack
                  spacing={4}
                  mb={4}
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => navigate(`/game/${review.content.externalId}`)}
                  _hover={{ bg: 'gray.100' }}
                >
                  {review.content.backgroundImage && (
                    <Image
                      src={review.content.backgroundImage}
                      alt={review.content.title}
                      boxSize="60px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  )}
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold">{review.content.title}</Text>
                    <HStack spacing={1}>{renderStars(review.rating)}</HStack>
                  </VStack>
                </HStack>

                <Text mb={4}>{review.text}</Text>

                <HStack spacing={4}>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<StarIcon />}
                    onClick={() => handleLike(review._id)}
                  >
                    {review.likes} {t('helpful')}
                  </Button>
                  <CommentSection reviewId={review._id} />
                </HStack>
              </Box>
            ))}

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

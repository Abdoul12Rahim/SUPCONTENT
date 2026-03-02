import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Avatar,
  Badge,
  Spinner,
  useToast,
  Button,
  Divider,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reviewAPI } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import { Loading } from '../components/Common/Loading';
import { CommentSection } from '../components/Content/CommentSection';

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
    slug: string;
    backgroundImage?: string;
    externalId: number;
  };
  rating: number;
  text: string;
  likes: number;
  isLiked?: boolean;
  spoiler: boolean;
  createdAt: string;
}

export const ReviewDetail = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getById(reviewId!);
      setReview(response.data);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la critique',
        status: 'error',
        duration: 5000,
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour liker une critique',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await reviewAPI.like(reviewId!);
      setReview((prev) => prev ? {
        ...prev,
        likes: response.data.likes,
        isLiked: response.data.liked,
      } : null);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de liker',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!review) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Critique introuvable</Text>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        {/* En-tête avec le jeu */}
        <Box>
          <Button
            variant="ghost"
            onClick={() => navigate(`/game/${review.content.slug}`)}
            mb={4}
          >
            ← Retour au jeu
          </Button>
          
          <HStack spacing={4} mb={6}>
            {review.content.backgroundImage && (
              <Box
                w="100px"
                h="60px"
                borderRadius="md"
                overflow="hidden"
                cursor="pointer"
                onClick={() => navigate(`/game/${review.content.slug}`)}
              >
                <img
                  src={review.content.backgroundImage}
                  alt={review.content.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            )}
            <VStack align="start" spacing={1}>
              <Text 
                fontSize="lg" 
                fontWeight="bold"
                cursor="pointer"
                _hover={{ color: 'blue.500' }}
                onClick={() => navigate(`/game/${review.content.slug}`)}
              >
                {review.content.title}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Critique par {review.user.displayName || review.user.username}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Divider />

        {/* Critique */}
        <Box bg="white" p={6} borderRadius="lg" shadow="md">
          <HStack spacing={4} mb={4}>
            <Avatar
              size="md"
              name={review.user.displayName || review.user.username}
              src={getAvatarUrl(review.user.avatar)}
              cursor="pointer"
              onClick={() => navigate(`/profile/${review.user._id}`)}
            />
            <VStack align="start" spacing={0} flex={1}>
              <Text 
                fontWeight="bold"
                cursor="pointer"
                _hover={{ color: 'blue.500' }}
                onClick={() => navigate(`/profile/${review.user._id}`)}
              >
                {review.user.displayName || review.user.username}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {formatDate(review.createdAt)}
              </Text>
            </VStack>
            <VStack align="end" spacing={2}>
              <HStack>
                <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                  ⭐ {review.rating}/5
                </Text>
              </HStack>
            </VStack>
          </HStack>

          {review.spoiler && (
            <Badge colorScheme="red" mb={2}>
              ⚠️ Spoiler
            </Badge>
          )}

          <Text whiteSpace="pre-wrap" mb={4}>
            {review.text}
          </Text>

          <HStack spacing={4}>
            <Button
              size="sm"
              variant={review.isLiked ? 'solid' : 'outline'}
              colorScheme={review.isLiked ? 'red' : 'gray'}
              leftIcon={<Text>{review.isLiked ? '❤️' : '🤍'}</Text>}
              onClick={handleLikeToggle}
            >
              {review.likes} {review.likes === 1 ? 'Like' : 'Likes'}
            </Button>
          </HStack>
        </Box>

        {/* Section commentaires */}
        <Box bg="white" p={6} borderRadius="lg" shadow="md">
          <Heading size="md" mb={4}>Commentaires</Heading>
          <CommentSection reviewId={reviewId!} />
        </Box>
      </VStack>
    </Container>
  );
};

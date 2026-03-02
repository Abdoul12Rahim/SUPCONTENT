import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Textarea,
  Avatar,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { StarIcon, RepeatIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { reviewAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CommentSection } from './CommentSection';

interface Review {
  _id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  rating: number;
  text: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

interface ReviewSectionProps {
  contentId: string;
}

export const ReviewSection = ({ contentId }: ReviewSectionProps) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated) {
      checkExistingReview();
    } else {
      setHasExistingReview(false);
    }
  }, [contentId, isAuthenticated]);

  const checkExistingReview = async () => {
    try {
      const response = await reviewAPI.getMyReview(contentId);
      console.log('Vérification avis existant:', response.data);
      setHasExistingReview(response.data.hasReview);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'avis:', error);
      // En cas d'erreur, autoriser quand même la création d'avis
      setHasExistingReview(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getByGame(contentId);
      console.log('ContentId:', contentId);
      console.log('Réponse complète:', response.data);
      console.log('Nombre d\'avis:', response.data.items?.length || 0);
      setReviews(response.data.items || []);
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await reviewAPI.getByGame(contentId);
      setReviews(response.data.items || []);
      toast({
        title: 'Actualisé',
        description: 'Les avis ont été actualisés',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des avis:', error);
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

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une note',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 3) {
      toast({
        title: 'Erreur',
        description: 'Votre avis doit contenir au moins 3 caractères',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await reviewAPI.create({
        contentId,
        rating,
        text: reviewText,
      });
      
      toast({
        title: 'Avis publié',
        description: 'Votre avis a été ajouté avec succès',
        status: 'success',
        duration: 3000,
      });

      setRating(0);
      setReviewText('');
      onClose();
      
      // Petit délai pour être sûr que l'avis est bien enregistré
      setTimeout(() => {
        fetchReviews();
        checkExistingReview();
      }, 500);
    } catch (error: any) {
      const errorData = error.response?.data;
      toast({
        title: 'Erreur',
        description: errorData?.message || 'Impossible de publier l\'avis',
        status: 'error',
        duration: 5000,
      });
      
      // Si c'est une erreur de duplicate, fermer le modal et rafraîchir l'état
      if (errorData?.code === 'DUPLICATE_REVIEW') {
        onClose();
        checkExistingReview();
      }
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour aimer un avis',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      await reviewAPI.like(reviewId);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible d\'aimer cet avis',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const renderStars = (count: number, interactive: boolean = false, onClick?: (index: number) => void) => {
    return (
      <HStack spacing={1}>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            color={star <= count ? 'yellow.400' : 'gray.300'}
            cursor={interactive ? 'pointer' : 'default'}
            onClick={() => interactive && onClick && onClick(star)}
            boxSize={interactive ? 6 : 4}
          />
        ))}
      </HStack>
    );
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Avis de la communauté</Heading>
        <HStack spacing={2}>
          <IconButton
            aria-label="Actualiser les avis"
            icon={<RepeatIcon />}
            variant="outline"
            colorScheme="blue"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
          />
          {isAuthenticated && (
            <Tooltip 
              label="Vous avez déjà écrit un avis pour ce jeu"
              isDisabled={!hasExistingReview}
              shouldWrapChildren
            >
              <Button 
                colorScheme="blue" 
                onClick={onOpen}
                isDisabled={hasExistingReview}
              >
                Écrire un avis
              </Button>
            </Tooltip>
          )}
        </HStack>
      </HStack>

      {/* Modal pour écrire un avis */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('writeReview')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>{t('rating')}</FormLabel>
                {renderStars(rating, true, setRating)}
              </FormControl>

              <FormControl>
                <FormLabel>{t('yourReview')}</FormLabel>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Partagez votre expérience avec ce jeu..."
                  rows={6}
                  maxLength={5000}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {reviewText.length}/5000 caractères (minimum 3)
                </Text>
              </FormControl>

              <HStack justify="flex-end">
                <Button variant="ghost" onClick={onClose}>
                  {t('cancel')}
                </Button>
                <Button colorScheme="blue" onClick={handleSubmitReview}>
                  {t('publish')}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Liste des avis */}
      <VStack spacing={4} align="stretch">
        {loading ? (
          <Text textAlign="center" py={10}>
            {t('loading')}
          </Text>
        ) : reviews.length === 0 ? (
          <Box textAlign="center" py={10} bg="gray.50" borderRadius="lg">
            <Text color="gray.600" fontSize="lg">
              {t('noReviews')}
            </Text>
            <Text color="gray.500" fontSize="sm" mt={2}>
              {t('beFirst')}
            </Text>
          </Box>
        ) : (
          reviews.map((review) => (
            <Box key={review._id} p={6} bg="white" borderRadius="lg" shadow="sm">
              <HStack align="start" spacing={4}>
                <Avatar
                  size="md"
                  name={review.user.displayName || review.user.username}
                  src={review.user.avatar}
                />
                <VStack align="stretch" flex={1} spacing={2}>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">
                        {review.user.displayName || review.user.username}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </Text>
                    </VStack>
                    {renderStars(review.rating)}
                  </HStack>

                  <Text color="gray.700">{review.text}</Text>

                  <HStack spacing={4} pt={2}>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<StarIcon />}
                      onClick={() => handleLikeReview(review._id)}
                      colorScheme={review.isLiked ? 'yellow' : 'gray'}
                    >
                      {review.likes > 0 ? review.likes : ''} {t('helpful')}
                    </Button>
                    <CommentSection reviewId={review._id} />
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};

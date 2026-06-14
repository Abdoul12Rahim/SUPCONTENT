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
  Button,
  useToast,
  Spinner,
  Flex,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Image,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import { socialAPI } from '../services/socialService';
import { UserListModal } from '../components/Social/UserListModal';
import { AchievementsSection } from '../components/Profile/AchievementsSection';
import { getAvatarUrl } from '../utils/avatar';

interface UserProfile {
  _id: string;
  username: string;
  displayName?: string;
  email: string;
  avatar?: string;
  bio?: string;
  isAdmin: boolean;
}

interface UserStats {
  libraryCount: number;
  reviewCount: number;
  followersCount: number;
  followingCount: number;
}

interface Review {
  _id: string;
  content: {
    title: string;
    externalId: number;
    backgroundImage?: string;
  };
  rating: number;
  text: string;
  likes: number;
  createdAt: string;
}

export const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ 
    libraryCount: 0, 
    reviewCount: 0,
    followersCount: 0,
    followingCount: 0
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);

  const C = {
    card: 'ui.card',
    elevated: 'ui.cardElevated',
    border: 'ui.border',
    text: 'ui.text',
    muted: 'ui.mutetext',
    primary: '#7c3aed',
    primarySoft: 'rgba(124,58,237,0.15)',
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchReviews();
      checkFollowStatus();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      setProfile(response.data.user);
      
      // Récupérer les stats
      const statsRes = await api.get(`/users/${userId}/stats`);
      setStats(statsRes.data);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le profil',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/user/${userId}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || !userId) return;
    
    try {
      // Vérifier si on suit cette personne
      const response = await socialAPI.checkFollowStatus(userId);
      setIsFollowing(response.data.isFollowing);
      
      // Vérifier si cette personne nous suit
      const followsMeResponse = await socialAPI.checkIfFollowsMe(userId);
      setFollowsMe(followsMeResponse.data.followsMe);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour suivre un utilisateur',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!userId) return;

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await socialAPI.unfollowUser(userId);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
        toast({
          title: 'Succès',
          description: 'Vous ne suivez plus cet utilisateur',
          status: 'success',
          duration: 2000,
        });
      } else {
        await socialAPI.followUser(userId);
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
        toast({
          title: 'Succès',
          description: 'Vous suivez maintenant cet utilisateur',
          status: 'success',
          duration: 2000,
        });
      }
      // Actualiser les données
      await fetchProfile();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de suivre l\'utilisateur',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour envoyer un message',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!userId) return;

    try {
      // Créer ou récupérer la conversation
      const response = await api.get(`/messages/conversations/with/${userId}`);
      const conversationId = response.data._id;
      
      // Rediriger vers la page de messages avec la conversation sélectionnée
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ouvrir la conversation',
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
          boxSize={3}
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

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Heading mb={4}>Profil non trouvé</Heading>
          <Text>Cet utilisateur n'existe pas</Text>
        </Box>
      </Container>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* En-tête du profil */}
        <Box bg={C.card} p={8} borderRadius="lg" border="1px solid" borderColor={C.border} shadow="sm">
          <HStack spacing={6} align="start">
            <Avatar 
              size="2xl" 
              name={profile.displayName || profile.username}
              src={getAvatarUrl(profile.avatar)}
            />
            <VStack align="start" flex={1} spacing={3}>
              <Heading size="lg" color={C.text}>{profile.displayName || profile.username}</Heading>
              <Text color={C.muted}>@{profile.username}</Text>
              {profile.bio && <Text mt={2} color={C.text}>{profile.bio}</Text>}
              <HStack spacing={2} mt={2}>
                <Badge bg={C.primarySoft} color="#c4b5fd">Membre</Badge>
                {profile.isAdmin && <Badge bg="rgba(16,185,129,0.16)" color="#34d399">Admin</Badge>}
              </HStack>
            </VStack>
            {!isOwnProfile && (
              <HStack spacing={2}>
                <Button
                  colorScheme={isFollowing ? 'gray' : 'purple'}
                  variant={isFollowing ? 'outline' : 'solid'}
                  onClick={handleFollow}
                  isLoading={followLoading}
                  size="lg"
                  color={isFollowing ? '#cbd5e1' : 'white'}
                >
                  {isFollowing ? 'Abonné' : (followsMe ? 'S\'abonner en retour' : 'S\'abonner')}
                </Button>
                <Button
                  colorScheme="purple"
                  variant="outline"
                  onClick={handleSendMessage}
                  size="lg"
                >
                  💬 Message
                </Button>
              </HStack>
            )}
            {isOwnProfile && (
              <Button
                colorScheme="purple"
                variant="outline"
                onClick={() => navigate('/settings')}
                size="lg"
              >
                Modifier le profil
              </Button>
            )}
          </HStack>
        </Box>

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Box bg={C.card} p={6} borderRadius="lg" border="1px solid" borderColor={C.border} shadow="sm">
            <Stat>
              <StatLabel color={C.muted}>{t('gamesInLibrary')}</StatLabel>
              <StatNumber color={C.text}>{stats.libraryCount}</StatNumber>
            </Stat>
          </Box>
          <Box bg={C.card} p={6} borderRadius="lg" border="1px solid" borderColor={C.border} shadow="sm">
            <Stat>
              <StatLabel color={C.muted}>{t('reviewsWritten')}</StatLabel>
              <StatNumber color={C.text}>{stats.reviewCount}</StatNumber>
            </Stat>
          </Box>
          <Box 
            bg={C.card}
            p={6} 
            borderRadius="lg" 
            border="1px solid"
            borderColor={C.border}
            shadow="sm"
            cursor="pointer"
            onClick={() => setModalType('followers')}
            _hover={{ bg: C.elevated }}
          >
            <Stat>
              <StatLabel color={C.muted}>{t('followers')}</StatLabel>
              <StatNumber color={C.text}>{stats.followersCount}</StatNumber>
            </Stat>
          </Box>
          <Box 
            bg={C.card}
            p={6} 
            borderRadius="lg" 
            border="1px solid"
            borderColor={C.border}
            shadow="sm"
            cursor="pointer"
            onClick={() => setModalType('following')}
            _hover={{ bg: C.elevated }}
          >
            <Stat>
              <StatLabel color={C.muted}>{t('following')}</StatLabel>
              <StatNumber color={C.text}>{stats.followingCount}</StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>

        <Divider borderColor={C.border} />

        {/* Achievements */}
        <Box bg={C.card} p={6} borderRadius="lg" border="1px solid" borderColor={C.border} shadow="sm">
          <AchievementsSection userId={userId!} isOwnProfile={isOwnProfile} />
        </Box>

        <Divider borderColor={C.border} />

        {/* Avis de l'utilisateur */}
        <Box bg={C.card} p={6} borderRadius="lg" border="1px solid" borderColor={C.border} shadow="sm">
          <Heading size="md" mb={4} color={C.text}>Avis récents</Heading>
          {reviews.length === 0 ? (
            <Text color={C.muted}>Aucun avis pour le moment</Text>
          ) : (
            <VStack spacing={4} align="stretch">
              {reviews.slice(0, 5).map((review) => (
                <Box
                  key={review._id}
                  p={4}
                  borderWidth="1px"
                  borderColor={C.border}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => navigate(`/game/${review.content.externalId}`)}
                  _hover={{ bg: C.elevated }}
                >
                  <HStack spacing={4}>
                    {review.content.backgroundImage && (
                      <Image
                        src={review.content.backgroundImage}
                        alt={review.content.title}
                        boxSize="60px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <VStack align="start" flex={1} spacing={1}>
                      <Text fontWeight="bold" color={C.text}>{review.content.title}</Text>
                      <HStack spacing={1}>{renderStars(review.rating)}</HStack>
                      <Text fontSize="sm" color={C.muted} noOfLines={2}>
                        {review.text}
                      </Text>
                      <Text fontSize="xs" color={C.muted}>
                        {formatTimeAgo(review.createdAt)}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>

      {/* Modal pour followers/following */}
      {userId && modalType && (
        <UserListModal
          isOpen={modalType !== null}
          onClose={() => {
            setModalType(null);
            // Actualiser les stats après fermeture du modal
            fetchProfile();
          }}
          userId={userId}
          type={modalType}
          title={modalType === 'followers' ? 'Abonnés' : 'Abonnements'}
        />
      )}
    </Container>
  );
};

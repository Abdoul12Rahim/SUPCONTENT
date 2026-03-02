import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Avatar,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  useToast,
  Spinner,
  Center,
  Badge,
  Flex
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { socialAPI } from '../services/socialService';
import { getAvatarUrl } from '../utils/avatar';

interface UserSuggestion {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
  stats: {
    followersCount: number;
    reviewCount: number;
  };
}

export const Discover = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour découvrir des utilisateurs',
        status: 'warning',
        duration: 3000,
      });
      navigate('/login');
      return;
    }

    fetchSuggestions();
  }, [isAuthenticated]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/social/suggestions');
      console.log('Suggestions reçues:', response.data);
      setSuggestions(response.data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des suggestions:', error);
      console.error('Détails:', error.response?.data);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de charger les suggestions',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await api.get(`/social/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    try {
      setFollowLoading(prev => ({ ...prev, [userId]: true }));

      if (isFollowing) {
        await socialAPI.unfollowUser(userId);
        toast({
          title: 'Désabonné',
          description: 'Vous ne suivez plus cet utilisateur',
          status: 'success',
          duration: 2000,
        });
      } else {
        await socialAPI.followUser(userId);
        toast({
          title: 'Abonné',
          description: 'Vous suivez maintenant cet utilisateur',
          status: 'success',
          duration: 2000,
        });
      }

      // Mettre à jour l'état local
      setSuggestions(prev => 
        prev.map(u => u._id === userId ? { ...u, isFollowing: !isFollowing } : u)
      );
      setSearchResults(prev => 
        prev.map(u => u._id === userId ? { ...u, isFollowing: !isFollowing } : u)
      );

    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de modifier l\'abonnement',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const UserCard = ({ user }: { user: UserSuggestion }) => (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      shadow="sm"
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
    >
      <VStack spacing={4}>
        <Avatar
          size="xl"
          name={user.displayName || user.username}
          src={getAvatarUrl(user.avatar)}
          cursor="pointer"
          onClick={() => navigate(`/profile/${user._id}`)}
        />
        <VStack spacing={1}>
          <Text
            fontWeight="bold"
            fontSize="lg"
            cursor="pointer"
            onClick={() => navigate(`/profile/${user._id}`)}
            _hover={{ color: 'blue.500' }}
          >
            {user.displayName || user.username}
          </Text>
          <Text fontSize="sm" color="gray.600">
            @{user.username}
          </Text>
        </VStack>
        
        {user.bio && (
          <Text fontSize="sm" color="gray.700" textAlign="center" noOfLines={2}>
            {user.bio}
          </Text>
        )}

        <HStack spacing={4} fontSize="sm" color="gray.600">
          <HStack>
            <Text>👥</Text>
            <Text fontWeight="medium">{user.stats.followersCount} abonnés</Text>
          </HStack>
          <HStack>
            <Text>✍️</Text>
            <Text fontWeight="medium">{user.stats.reviewCount} critiques</Text>
          </HStack>
        </HStack>

        <Button
          width="full"
          colorScheme={user.isFollowing ? 'gray' : 'blue'}
          variant={user.isFollowing ? 'outline' : 'solid'}
          onClick={() => handleFollowToggle(user._id, user.isFollowing || false)}
          isLoading={followLoading[user._id]}
          size="sm"
        >
          {user.isFollowing ? '✓ Abonné' : '+ Suivre'}
        </Button>
      </VStack>
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* En-tête */}
        <Box>
          <Heading mb={2}>🔍 Découvrir</Heading>
          <Text color="gray.600">Trouvez de nouveaux utilisateurs à suivre</Text>
        </Box>

        {/* Barre de recherche */}
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>
        </Box>

        {/* Résultats de recherche */}
        {searchQuery && (
          <Box>
            <Heading size="md" mb={4}>
              Résultats de recherche
            </Heading>
            {searchLoading ? (
              <Center py={8}>
                <Spinner size="lg" color="blue.500" />
              </Center>
            ) : searchResults.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                {searchResults.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </SimpleGrid>
            ) : (
              <Box bg="gray.50" p={8} borderRadius="lg" textAlign="center">
                <Text fontSize="3xl" mb={2}>🔍</Text>
                <Text color="gray.600">Aucun utilisateur trouvé</Text>
              </Box>
            )}
          </Box>
        )}

        {/* Suggestions */}
        {!searchQuery && (
          <Box>
            <Heading size="md" mb={4}>
              Suggestions pour vous
            </Heading>
            {loading ? (
              <Center py={8}>
                <Spinner size="lg" color="blue.500" />
              </Center>
            ) : suggestions.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                {suggestions.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </SimpleGrid>
            ) : (
              <Box bg="gray.50" p={8} borderRadius="lg" textAlign="center">
                <Text fontSize="3xl" mb={2}>👥</Text>
                <Text color="gray.600">Aucune suggestion disponible</Text>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Revenez plus tard pour découvrir de nouveaux utilisateurs
                </Text>
              </Box>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  );
};

import {
  Container,
  Heading,
  VStack,
  SimpleGrid,
  Text,
  Box,
  useToast,
  Button,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { SearchIcon, TimeIcon, StarIcon } from '@chakra-ui/icons';
import { SearchBar } from '../components/Content/SearchBar';
import { GameCard } from '../components/Content/GameCard';
import { Loading } from '../components/Common/Loading';
import { contentAPI } from '../services/api';

interface Game {
  externalId: number;
  slug: string;
  title: string;
  description?: string;
  backgroundImage?: string;
  rating?: number;
  released?: string;
  genres?: string[];
  platforms?: string[];
}

type SortOption = 'trending' | 'recent' | 'rating';

export const Home = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [showSearch, setShowSearch] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPopularGames();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      fetchGamesBySorting();
    } else {
      // Si on a une recherche active, on la relance avec le nouveau tri
      handleSearch(searchQuery);
    }
  }, [sortBy]);

  const fetchGamesBySorting = async () => {
    try {
      setLoading(true);
      let response;
      
      if (sortBy === 'trending') {
        response = await contentAPI.getPopular();
      } else if (sortBy === 'recent') {
        response = await contentAPI.getNew();
      } else if (sortBy === 'rating') {
        // Pour les mieux notés, on utilise search avec ordering
        response = await contentAPI.search('', 1, '-rating');
      }
      
      setGames(response?.data.results || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les jeux',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularGames = async () => {
    try {
      setLoading(true);
      const response = await contentAPI.getPopular();
      setGames(response.data.results || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les jeux',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      fetchGamesBySorting();
      return;
    }

    try {
      setLoading(true);
      let ordering = '';
      
      if (sortBy === 'rating') {
        ordering = '-rating';
      } else if (sortBy === 'recent') {
        ordering = '-released';
      } else if (sortBy === 'trending') {
        ordering = '-added';
      }
      
      const response = await contentAPI.search(query, 1, ordering);
      setGames(response.data.results || []);
    } catch (error: any) {
      toast({
        title: 'Erreur de recherche',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && games.length === 0) {
    return <Loading />;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Hero Section */}
        <Box textAlign="center" py={8}>
          <Heading size="2xl" mb={4} fontWeight="bold">
            Découvrez votre prochain jeu favori
          </Heading>
          <Text fontSize="lg" color="gray.600" mb={6}>
            Explorez, organisez et partagez vos jeux vidéo préférés avec la communauté
          </Text>
          
          {!showSearch ? (
            <Button
              size="lg"
              colorScheme="gray"
              bg="gray.900"
              color="white"
              leftIcon={<SearchIcon />}
              borderRadius="full"
              px={8}
              _hover={{ bg: 'gray.800' }}
              onClick={() => setShowSearch(true)}
            >
              Rechercher un jeu
            </Button>
          ) : (
            <Box maxW="600px" mx="auto">
              <SearchBar onSearch={handleSearch} />
            </Box>
          )}
        </Box>

        {/* Sort Tabs */}
        <HStack spacing={4} justify="flex-start">
          <Button
            leftIcon={<Text>📈</Text>}
            variant={sortBy === 'trending' ? 'solid' : 'ghost'}
            colorScheme={sortBy === 'trending' ? 'blue' : 'gray'}
            bg={sortBy === 'trending' ? 'gray.100' : 'transparent'}
            borderRadius="full"
            onClick={() => setSortBy('trending')}
          >
            Tendances
          </Button>
          <Button
            leftIcon={<Icon as={TimeIcon} />}
            variant={sortBy === 'recent' ? 'solid' : 'ghost'}
            colorScheme={sortBy === 'recent' ? 'blue' : 'gray'}
            bg={sortBy === 'recent' ? 'gray.100' : 'transparent'}
            borderRadius="full"
            onClick={() => setSortBy('recent')}
          >
            Récemment ajoutés
          </Button>
          <Button
            leftIcon={<Icon as={StarIcon} />}
            variant={sortBy === 'rating' ? 'solid' : 'ghost'}
            colorScheme={sortBy === 'rating' ? 'blue' : 'gray'}
            bg={sortBy === 'rating' ? 'gray.100' : 'transparent'}
            borderRadius="full"
            onClick={() => setSortBy('rating')}
          >
            Mieux notés
          </Button>
        </HStack>

        {loading ? (
          <Loading />
        ) : (
          <>
            {games.length === 0 ? (
              <Text textAlign="center" py={10} color="gray.500">
                Aucun jeu trouvé
              </Text>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {games.map((game) => (
                  <GameCard
                    key={game.externalId}
                    id={game.externalId.toString()}
                    title={game.title}
                    slug={game.slug}
                    image={game.backgroundImage}
                    rating={game.rating}
                    releaseDate={game.released}
                    genres={game.genres}
                    platforms={game.platforms}
                  />
                ))}
              </SimpleGrid>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
};

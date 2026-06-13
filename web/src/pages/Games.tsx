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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { SearchIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
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

export const Games = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState('Toutes les plateformes');
  const [selectedGenre, setSelectedGenre] = useState('Tous les genres');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const toast = useToast();
  const C = {
    panel: '#13131f',
    panelElevated: '#1a1a2e',
    border: 'rgba(255,255,255,0.08)',
    text: '#f1f5f9',
    muted: '#94a3b8',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primarySoft: 'rgba(124,58,237,0.15)',
    primaryBorder: 'rgba(124,58,237,0.35)',
  };

  const platforms = [
    'Toutes les plateformes',
    'PC',
    'PS4',
    'Xbox One',
    'Switch',
    'PS5',
    'Xbox Series X'
  ];

  const genres = [
    'Tous les genres',
    'Action',
    'Adventure', 
    'RPG',
    'Strategy',
    'Sports',
    'Simulation',
    'Puzzle',
    'Platformer',
    'Shooter',
    'Fighting',
    'Racing',
    'Horror',
    'Indie',
    'Casual',
    'Arcade'
  ];

  // Fonction pour vérifier si le titre ne contient PAS de caractères CJK (chinois, japonais, coréen)
  const hasNoCJKCharacters = (title: string): boolean => {
    // Rejette les caractères CJK (Chinese, Japanese, Korean)
    const cjkRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u1100-\u11FF]/;
    return !cjkRegex.test(title);
  };

  // Filtrer les jeux pour exclure ceux avec des titres en caractères CJK
  const filterNonCJKGames = (gameList: Game[]): Game[] => {
    return gameList.filter(game => hasNoCJKCharacters(game.title));
  };

  useEffect(() => {
    fetchGames();
  }, [currentPage, selectedPlatform, selectedGenre]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const genreQuery = selectedGenre !== 'Tous les genres' ? selectedGenre.toLowerCase() : '';
      const response = await contentAPI.search(searchQuery, currentPage, '-rating', genreQuery);
      const filteredGames = filterNonCJKGames(response.data.results || []);
      setGames(filteredGames);
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1);
  };
  
  const handleSearchSubmit = () => {
    fetchGames();
  };

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (loading && games.length === 0) {
    return <Loading />;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Titre */}
        <Heading size="xl" fontWeight="bold" color={C.text}>
          Recherche
        </Heading>

        {/* Barre de recherche avec boutons de vue */}
        <HStack spacing={4}>
          <InputGroup size="lg" flex={1}>
            <InputLeftElement pointerEvents="none">
              <Icon as={SearchIcon} color={C.muted} />
            </InputLeftElement>
            <Input
              value={searchQuery}
              onChange={handleSearch}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Rechercher un jeu, un développeur..."
              bg={C.panelElevated}
              color={C.text}
              borderRadius="lg"
              border="1px solid"
              borderColor={C.border}
              _placeholder={{ color: C.muted }}
              _focus={{ borderColor: C.primaryBorder, boxShadow: 'none', bg: C.panelElevated }}
            />
          </InputGroup>
          <IconButton
            aria-label="Vue grille"
            icon={<ViewIcon />}
            size="lg"
            variant={viewMode === 'grid' ? 'solid' : 'ghost'}
            bg={viewMode === 'grid' ? C.primary : C.panelElevated}
            color={viewMode === 'grid' ? 'white' : C.muted}
            border="1px solid"
            borderColor={viewMode === 'grid' ? C.primary : C.border}
            onClick={() => setViewMode('grid')}
            _hover={{ bg: viewMode === 'grid' ? C.primaryHover : C.primarySoft, color: C.text }}
          />
          <IconButton
            aria-label="Vue liste"
            icon={<ViewOffIcon />}
            size="lg"
            variant={viewMode === 'list' ? 'solid' : 'ghost'}
            bg={viewMode === 'list' ? C.primary : C.panelElevated}
            color={viewMode === 'list' ? 'white' : C.muted}
            border="1px solid"
            borderColor={viewMode === 'list' ? C.primary : C.border}
            onClick={() => setViewMode('list')}
            _hover={{ bg: viewMode === 'list' ? C.primaryHover : C.primarySoft, color: C.text }}
          />
        </HStack>

        {/* Filtres */}
        <HStack spacing={4} align="center">
          <Text fontSize="sm" color={C.muted} display="flex" alignItems="center">
            <Icon as={SearchIcon} mr={2} boxSize={4} />
            Filtres :
          </Text>
          
          {/* Filtre Plateformes */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              bg={C.panelElevated}
              color={C.text}
              border="1px solid"
              borderColor={C.border}
              _hover={{ bg: C.primarySoft }}
              _active={{ bg: C.primarySoft }}
              borderRadius="lg"
              fontWeight="normal"
            >
              {selectedPlatform}
            </MenuButton>
            <MenuList maxH="400px" overflowY="auto" bg={C.panel} borderColor={C.border}>
              {platforms.map((platform) => (
                <MenuItem
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  color={C.text}
                  bg={selectedPlatform === platform ? C.primarySoft : 'transparent'}
                  fontWeight={selectedPlatform === platform ? 'bold' : 'normal'}
                  icon={selectedPlatform === platform ? <Text>✓</Text> : undefined}
                  _hover={{ bg: C.primarySoft }}
                >
                  {platform}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Filtre Genres */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              bg={C.panelElevated}
              color={C.text}
              border="1px solid"
              borderColor={C.border}
              _hover={{ bg: C.primarySoft }}
              _active={{ bg: C.primarySoft }}
              borderRadius="lg"
              fontWeight="normal"
            >
              {selectedGenre}
            </MenuButton>
            <MenuList maxH="400px" overflowY="auto" bg={C.panel} borderColor={C.border}>
              {genres.map((genre) => (
                <MenuItem
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  color={C.text}
                  bg={selectedGenre === genre ? C.primarySoft : 'transparent'}
                  fontWeight={selectedGenre === genre ? 'bold' : 'normal'}
                  icon={selectedGenre === genre ? <Text>✓</Text> : undefined}
                  _hover={{ bg: C.primarySoft }}
                >
                  {genre}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </HStack>

        {/* Compteur de résultats */}
        <Text fontSize="sm" color={C.muted}>
          {games.length} résultats
        </Text>

        {/* Contenu */}
        {loading ? (
          <Loading />
        ) : (
          <>
            {games.length === 0 ? (
              <Box textAlign="center" py={20}>
                <Text fontSize="lg" color={C.muted}>
                  Aucun jeu trouvé
                </Text>
              </Box>
            ) : (
              <>
                <SimpleGrid 
                  columns={viewMode === 'grid' ? { base: 1, md: 2, lg: 3 } : 1} 
                  spacing={6}
                >
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

                {/* Pagination */}
                <HStack justify="center" spacing={4} mt={8}>
                  <Button
                    onClick={handlePrevPage}
                    isDisabled={currentPage === 1}
                    colorScheme="brand"
                    variant="outline"
                    size="sm"
                  >
                    Précédent
                  </Button>
                  <Text fontSize="sm" color={C.text}>Page {currentPage}</Text>
                  <Button
                    onClick={handleNextPage}
                    colorScheme="brand"
                    variant="outline"
                    size="sm"
                  >
                    Suivant
                  </Button>
                </HStack>
              </>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
};

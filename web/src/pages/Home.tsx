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
  Flex,
  Badge,
  Avatar,
  Skeleton,
  SkeletonText,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { SearchIcon, TimeIcon, StarIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/Content/SearchBar';
import { GameCard } from '../components/Content/GameCard';
import { Loading } from '../components/Common/Loading';
import { contentAPI, newsAPI, roomsAPI } from '../services/api';

// ── Palette identique au mobile ──────────────────────────────────────────
const C = {
  primary: '#7c3aed',
  primaryLight: 'rgba(124,58,237,0.15)',
  primaryBorder: 'rgba(124,58,237,0.25)',
  surface: '#13131f',
  surfaceElevated: '#1a1a2e',
  border: 'rgba(255,255,255,0.06)',
  textLight: '#f1f5f9',
  textMuted: '#64748b',
  accentGreen: '#10b981',
  accentBlue: '#06b6d4',
};

const FALLBACK_EVENTS = [
  { id: '1', title: 'Call of Duty League 2026 — Major Championship', category: 'TOURNOI E-SPORT', status: '🔴 EN DIRECT', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', url: 'https://www.twitch.tv/callofduty' },
  { id: '2', title: 'PlayStation Showcase : Les sorties de la rentrée', category: 'CONFÉRENCE', status: 'CE SOIR 20H', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=800&q=80', url: 'https://www.youtube.com/playstation' },
  { id: '3', title: 'Elden Ring — World Record Speedrun Attempt', category: 'SPEEDRUN', status: '🔴 EN DIRECT', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80', url: 'https://www.twitch.tv' },
];

const FALLBACK_ROOMS = [
  { id: '101', game: 'GTA VI', usersCount: 142, image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80' },
  { id: '102', game: 'Valorant', usersCount: 89, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80' },
  { id: '103', game: 'Elden Ring', usersCount: 56, image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&q=80' },
  { id: '104', game: 'Fortnite', usersCount: 204, image: 'https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=200&q=80' },
];

const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=200&q=80';

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
  const [newReleases, setNewReleases] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [showSearch, setShowSearch] = useState(false);
  const [events, setEvents] = useState(FALLBACK_EVENTS);
  const [activeRooms, setActiveRooms] = useState(FALLBACK_ROOMS);
  const [headlines, setHeadlines] = useState<{ id: string; title: string; source?: string; url?: string }[]>([]);
  const [activeEventIdx, setActiveEventIdx] = useState(0);
  const toast = useToast();
  const eventTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll carousel événements
  useEffect(() => {
    eventTimer.current = setInterval(() => {
      setActiveEventIdx((i) => (i + 1) % events.length);
    }, 3500);
    return () => { if (eventTimer.current) clearInterval(eventTimer.current); };
  }, [events.length]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (!searchQuery) fetchGamesBySorting();
    else handleSearch(searchQuery);
  }, [sortBy]);

  const fetchHomeData = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      contentAPI.getPopular(1),
      contentAPI.getNew(1),
      roomsAPI.getActive(),
      roomsAPI.getEvents(),
      newsAPI.getHeadlines(),
    ]);
    if (results[0].status === 'fulfilled') {
      const data = (results[0] as PromiseFulfilledResult<any>).value.data;
      setGames((data.results || data).slice(0, 12));
    }
    if (results[1].status === 'fulfilled') {
      const data = (results[1] as PromiseFulfilledResult<any>).value.data;
      setNewReleases((data.results || data).slice(0, 8));
    }
    if (results[2].status === 'fulfilled') {
      const data = (results[2] as PromiseFulfilledResult<any>).value.data;
      if (Array.isArray(data) && data.length > 0) {
        const normalizedRooms = data.map((room: any) => ({
          ...room,
          image:
            room.image ||
            room.backgroundImage ||
            room.background_image ||
            room.thumbnail ||
            DEFAULT_ROOM_IMAGE,
          game: room.game || room.title || room.name || 'Room',
          usersCount: typeof room.usersCount === 'number' ? room.usersCount : 0,
        }));
        setActiveRooms(normalizedRooms);
      }
    }
    if (results[3].status === 'fulfilled') {
      const data = (results[3] as PromiseFulfilledResult<any>).value.data;
      if (Array.isArray(data) && data.length > 0) setEvents(data);
    }
    if (results[4].status === 'fulfilled') {
      const data = (results[4] as PromiseFulfilledResult<any>).value.data;
      if (Array.isArray(data)) setHeadlines(data.slice(0, 4));
    }
    setLoading(false);
  };

  const fetchGamesBySorting = async () => {
    try {
      setLoading(true);
      let response: any;
      if (sortBy === 'trending') response = await contentAPI.getPopular();
      else if (sortBy === 'recent') response = await contentAPI.getNew();
      else response = await contentAPI.search('', 1, '-rating');
      setGames((response?.data.results || []).slice(0, 12));
    } catch {
      toast({ title: 'Impossible de charger les jeux', status: 'error', duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { fetchGamesBySorting(); return; }
    try {
      setLoading(true);
      const ordering = sortBy === 'rating' ? '-rating' : sortBy === 'recent' ? '-released' : '-added';
      const response = await contentAPI.search(query, 1, ordering);
      setGames(response.data.results || []);
    } catch (error: any) {
      toast({ title: 'Erreur de recherche', description: error.message, status: 'error', duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const activeEvent = events[activeEventIdx];

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={10} align="stretch">

        {/* ── Carousel événements ───────────────────────────────────── */}
        <Box>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="bold" fontSize="lg" color={C.textLight}>🔴 Événements en direct</Text>
          </Flex>
          <Box
            position="relative" borderRadius="2xl" overflow="hidden"
            h={{ base: '180px', md: '260px' }}
            border={`1px solid ${C.primaryBorder}`}
            cursor="pointer"
            onClick={() => activeEvent?.url && window.open(activeEvent.url, '_blank', 'noopener,noreferrer')}
          >
            {loading ? (
              <Skeleton h="full" w="full" startColor={C.surface} endColor={C.surfaceElevated} />
            ) : (
              <>
                <img
                  src={activeEvent?.image}
                  alt={activeEvent?.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.4s' }}
                />
                <Box
                  position="absolute" inset={0}
                  bg="linear-gradient(to top, rgba(13,13,20,0.92) 0%, transparent 60%)"
                />
                <Box position="absolute" bottom={4} left={4} right={4}>
                  <Badge
                    bg={C.primaryLight} color={C.primary} borderRadius="full"
                    px={2} py={0.5} fontSize="xs" mb={1}
                  >
                    {activeEvent?.category}
                  </Badge>
                  <Text fontWeight="bold" color={C.textLight} fontSize={{ base: 'sm', md: 'lg' }} noOfLines={2}>
                    {activeEvent?.title}
                  </Text>
                  <Badge bg="rgba(239,68,68,0.2)" color="#f87171" borderRadius="full" fontSize="xs" mt={1}>
                    {activeEvent?.status}
                  </Badge>
                </Box>
              </>
            )}
          </Box>
          {/* Indicateurs */}
          <HStack justify="center" mt={2} spacing={1}>
            {events.map((_, i) => (
              <Box
                key={i}
                w={i === activeEventIdx ? '20px' : '6px'} h="6px"
                borderRadius="full"
                bg={i === activeEventIdx ? C.primary : C.border}
                cursor="pointer"
                transition="width 0.3s"
                onClick={() => setActiveEventIdx(i)}
              />
            ))}
          </HStack>
        </Box>

        {/* ── Salons actifs ──────────────────────────────────────────── */}
        <Box>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="bold" fontSize="lg" color={C.textLight}>💬 Salons actifs</Text>
            <Link to="/rooms">
              <Text fontSize="sm" color={C.primary} fontWeight="600" cursor="pointer">
                Voir tous →
              </Text>
            </Link>
          </Flex>
          <HStack spacing={3} overflowX="auto" pb={2}
            css={{ '&::-webkit-scrollbar': { height: '4px' }, '&::-webkit-scrollbar-thumb': { background: C.primaryBorder, borderRadius: '2px' } }}
          >
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <Box key={i} flexShrink={0} w="80px">
                    <Skeleton w="64px" h="64px" borderRadius="xl" mb={1} startColor={C.surface} endColor={C.surfaceElevated} />
                    <SkeletonText noOfLines={1} w="64px" startColor={C.surface} endColor={C.surfaceElevated} />
                  </Box>
                ))
              : activeRooms.map((room: any) => (
                  <Link to="/rooms" key={room.id}>
                    <VStack spacing={1} flexShrink={0} cursor="pointer" _hover={{ opacity: 0.8 }}>
                      <Box
                        w="64px" h="64px" borderRadius="xl" overflow="hidden"
                        border={`2px solid ${C.primaryBorder}`} position="relative"
                      >
                        <img
                          src={room.image || DEFAULT_ROOM_IMAGE}
                          alt={room.game}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(event) => {
                            const target = event.currentTarget;
                            target.onerror = null;
                            target.src = DEFAULT_ROOM_IMAGE;
                          }}
                        />
                        <Box
                          position="absolute" bottom={0} right={0}
                          bg={C.accentGreen} w="10px" h="10px" borderRadius="full"
                          border="2px solid #0d0d14"
                        />
                      </Box>
                      <Text fontSize="xs" color={C.textLight} noOfLines={1} maxW="64px" textAlign="center">{room.game}</Text>
                      <Text fontSize="10px" color={C.textMuted}>{room.usersCount} en ligne</Text>
                    </VStack>
                  </Link>
                ))
            }
          </HStack>
        </Box>

        {/* ── Actualités ─────────────────────────────────────────────── */}
        {(headlines.length > 0 || loading) && (
          <Box>
            <Text fontWeight="bold" fontSize="lg" color={C.textLight} mb={3}>📰 Actualités gaming</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {loading
                ? Array(4).fill(0).map((_, i) => (
                    <Box key={i} p={3} bg={C.surface} borderRadius="xl" border={`1px solid ${C.border}`}>
                      <SkeletonText noOfLines={2} startColor={C.surface} endColor={C.surfaceElevated} />
                    </Box>
                  ))
                : headlines.map((h: any, i) => (
                    <Box
                      key={h.id || i} p={3} bg={C.surface} borderRadius="xl"
                      border={`1px solid ${C.border}`} cursor="pointer"
                      _hover={{ borderColor: C.primaryBorder, bg: C.surfaceElevated }}
                      onClick={() => h.url && window.open(h.url, '_blank', 'noopener,noreferrer')}
                    >
                      <Badge bg={C.primaryLight} color={C.primary} fontSize="10px" mb={1} borderRadius="full" px={2}>
                        {h.source || 'Gaming News'}
                      </Badge>
                      <Text fontSize="sm" fontWeight="600" color={C.textLight} noOfLines={2}>{h.title}</Text>
                    </Box>
                  ))
              }
            </SimpleGrid>
          </Box>
        )}

        {/* ── Nouvelles sorties ──────────────────────────────────────── */}
        {(newReleases.length > 0 || loading) && !searchQuery && (
          <Box>
            <Text fontWeight="bold" fontSize="lg" color={C.textLight} mb={3}>🆕 Nouvelles sorties</Text>
            <HStack spacing={4} overflowX="auto" pb={2}
              css={{ '&::-webkit-scrollbar': { height: '4px' }, '&::-webkit-scrollbar-thumb': { background: C.primaryBorder, borderRadius: '2px' } }}
            >
              {loading
                ? Array(6).fill(0).map((_, i) => (
                    <Box key={i} flexShrink={0} w="140px">
                      <Skeleton w="140px" h="90px" borderRadius="xl" mb={2} startColor={C.surface} endColor={C.surfaceElevated} />
                      <SkeletonText noOfLines={1} startColor={C.surface} endColor={C.surfaceElevated} />
                    </Box>
                  ))
                : newReleases.map((g) => (
                    <Link to={`/game/${g.slug}`} key={g.externalId}>
                      <Box
                        flexShrink={0} w="140px" cursor="pointer"
                        _hover={{ transform: 'translateY(-2px)', transition: 'transform 0.2s' }}
                      >
                        <Box w="140px" h="90px" borderRadius="xl" overflow="hidden" mb={2} border={`1px solid ${C.border}`}>
                          <img
                            src={g.backgroundImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=200&q=80'}
                            alt={g.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                        <Text fontSize="xs" color={C.textLight} noOfLines={1} fontWeight="600">{g.title}</Text>
                        {g.rating && (
                          <Text fontSize="10px" color="#facc15">⭐ {g.rating.toFixed(1)}</Text>
                        )}
                      </Box>
                    </Link>
                  ))
              }
            </HStack>
          </Box>
        )}

        {/* ── Section principale jeux ────────────────────────────────── */}
        <Box>
          {/* Barre recherche + tri */}
          <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
            <Text fontWeight="bold" fontSize="lg" color={C.textLight}>
              {searchQuery ? `Résultats pour "${searchQuery}"` : '🎮 Jeux populaires'}
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm" leftIcon={<Text>📈</Text>}
                variant={sortBy === 'trending' ? 'solid' : 'ghost'}
                bg={sortBy === 'trending' ? C.primary : 'transparent'}
                color={sortBy === 'trending' ? 'white' : C.textMuted}
                _hover={{ bg: C.primaryLight, color: C.textLight }}
                borderRadius="full"
                onClick={() => setSortBy('trending')}
              >
                Tendances
              </Button>
              <Button
                size="sm" leftIcon={<Icon as={TimeIcon} />}
                variant={sortBy === 'recent' ? 'solid' : 'ghost'}
                bg={sortBy === 'recent' ? C.primary : 'transparent'}
                color={sortBy === 'recent' ? 'white' : C.textMuted}
                _hover={{ bg: C.primaryLight, color: C.textLight }}
                borderRadius="full"
                onClick={() => setSortBy('recent')}
              >
                Récents
              </Button>
              <Button
                size="sm" leftIcon={<Icon as={StarIcon} />}
                variant={sortBy === 'rating' ? 'solid' : 'ghost'}
                bg={sortBy === 'rating' ? C.primary : 'transparent'}
                color={sortBy === 'rating' ? 'white' : C.textMuted}
                _hover={{ bg: C.primaryLight, color: C.textLight }}
                borderRadius="full"
                onClick={() => setSortBy('rating')}
              >
                Mieux notés
              </Button>
            </HStack>
          </Flex>

          {!showSearch ? (
            <Button
              size="md" leftIcon={<SearchIcon />} borderRadius="full"
              bg={C.primaryLight} color={C.primary} border={`1px solid ${C.primaryBorder}`}
              _hover={{ bg: C.primaryBorder }} mb={4}
              onClick={() => setShowSearch(true)}
            >
              Rechercher un jeu
            </Button>
          ) : (
            <Box maxW="600px" mb={4}>
              <SearchBar onSearch={handleSearch} />
            </Box>
          )}

          {loading && games.length === 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {Array(6).fill(0).map((_, i) => (
                <Box key={i} bg={C.surface} borderRadius="xl" overflow="hidden" border={`1px solid ${C.border}`}>
                  <Skeleton h="180px" startColor={C.surface} endColor={C.surfaceElevated} />
                  <Box p={4}><SkeletonText noOfLines={2} startColor={C.surface} endColor={C.surfaceElevated} /></Box>
                </Box>
              ))}
            </SimpleGrid>
          ) : games.length === 0 ? (
            <Text textAlign="center" py={10} color={C.textMuted}>Aucun jeu trouvé</Text>
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
        </Box>

      </VStack>
    </Container>
  );
};

import {
  Container,
  Box,
  Image,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Grid,
  GridItem,
  Divider,
  useToast,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { StarIcon, AddIcon, CheckIcon, DeleteIcon } from '@chakra-ui/icons';
import { contentAPI, libraryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Loading } from '../components/Common/Loading';
import { ReviewSection } from '../components/Content/ReviewSection';

interface GameDetails {
  _id?: string;
  externalId: number;
  title: string;
  slug: string;
  description?: string;
  backgroundImage?: string;
  rating?: number;
  released?: string;
  genres?: string[];
  platforms?: string[];
  developers?: string[];
  publishers?: string[];
  metacritic?: number;
  website?: string;
  esrbRating?: string;
  reviewCount?: number;
}

export const ContentPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [inLibrary, setInLibrary] = useState(false);
  const [libraryStatus, setLibraryStatus] = useState('playing');
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const infoCardBg = useColorModeValue('white', 'gray.800');
  const infoCardBorder = useColorModeValue('gray.200', 'gray.700');
  const libraryOnBg = useColorModeValue('green.50', 'green.900');
  const libraryOffBg = useColorModeValue('white', 'gray.800');
  const selectBg = useColorModeValue('white', 'gray.800');
  const bodyText = useColorModeValue('gray.700', 'gray.300');
  const metaText = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    if (slug) {
      fetchGameDetails();
    }
  }, [slug]);

  useEffect(() => {
    if (game && isAuthenticated) {
      checkIfInLibrary();
    }
  }, [game, isAuthenticated]);

  const checkIfInLibrary = async () => {
    try {
      const response = await libraryAPI.check(game!.externalId.toString());
      setInLibrary(response.data.inLibrary);
      if (response.data.inLibrary) {
        setLibraryStatus(response.data.status);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la bibliothèque:', error);
    }
  };

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      // Utiliser getById qui gère maintenant à la fois les IDs et les slugs
      const response = await contentAPI.getById(slug!);
      setGame(response.data);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails du jeu',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour ajouter des jeux à votre bibliothèque',
        status: 'warning',
        duration: 5000,
      });
      return;
    }

    try {
      await libraryAPI.add({
        contentId: game!.externalId.toString(),
        status: libraryStatus as 'playing' | 'completed' | 'to_play' | 'dropped',
      });
      setInLibrary(true);
      // Émettre un événement pour actualiser les compteurs
      window.dispatchEvent(new CustomEvent('libraryUpdated'));
      toast({
        title: 'Ajouté à la bibliothèque',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleRemoveFromLibrary = async () => {
    try {
      await libraryAPI.remove(game!.externalId.toString());
      setInLibrary(false);
      // Émettre un événement pour actualiser les compteurs
      window.dispatchEvent(new CustomEvent('libraryUpdated'));
      toast({
        title: 'Retiré de la bibliothèque',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (loading || !game) {
    return <Loading />;
  }

  return (
    <Box>
      <Box
        h="400px"
        bgImage={`url(${game.backgroundImage})`}
        bgSize="cover"
        bgPosition="center"
        position="relative"
        _after={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bg: 'blackAlpha.600',
        }}
      >
        <Container maxW="container.xl" h="100%" position="relative" zIndex={1}>
          <VStack align="flex-start" justify="flex-end" h="100%" pb={8} spacing={4} color="white">
            <Heading size="2xl">{game.title}</Heading>
            {game.released && (
              <Text fontSize="lg">{new Date(game.released).getFullYear()}</Text>
            )}
            <HStack spacing={4}>
              {game.rating && (
                <HStack>
                  <StarIcon color="yellow.400" />
                  <Text fontWeight="bold" fontSize="xl">
                    {game.rating.toFixed(1)}
                  </Text>
                </HStack>
              )}
              {game.metacritic && (
                <Badge colorScheme="green" fontSize="md" p={2}>
                  Metacritic: {game.metacritic}
                </Badge>
              )}
            </HStack>
          </VStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        <Grid templateColumns="repeat(12, 1fr)" gap={8}>
          <GridItem colSpan={{ base: 12, lg: 8 }}>
            <VStack align="stretch" spacing={6}>
              <Box>
                <Heading size="lg" mb={4}>
                  À propos
                </Heading>
                <Text color={bodyText}>{game.description || 'Aucune description disponible.'}</Text>
              </Box>

              <Divider />

              {game.genres && game.genres.length > 0 && (
                <Box>
                  <Heading size="md" mb={2}>
                    Genres
                  </Heading>
                  <HStack spacing={2} flexWrap="wrap">
                    {game.genres.map((genre, index) => (
                      <Badge key={index} colorScheme="purple">
                        {genre}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}

              {game.platforms && game.platforms.length > 0 && (
                <Box>
                  <Heading size="md" mb={2}>
                    Plateformes
                  </Heading>
                  <HStack spacing={2} flexWrap="wrap">
                    {game.platforms.map((platform, index) => (
                      <Badge key={index} colorScheme="blue">
                        {platform}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          </GridItem>

          <GridItem colSpan={{ base: 12, lg: 4 }}>
            <VStack align="stretch" spacing={4} position="sticky" top="80px">
              {isAuthenticated && (
                <Box
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  bg={inLibrary ? libraryOnBg : libraryOffBg}
                  borderColor={infoCardBorder}
                >
                  {inLibrary ? (
                    <>
                      <HStack mb={3}>
                        <CheckIcon color="green.500" />
                        <Text color="green.700" fontWeight="semibold">
                          Dans votre bibliothèque
                        </Text>
                      </HStack>
                      <Select
                        value={libraryStatus}
                        onChange={(e) => setLibraryStatus(e.target.value)}
                        mb={3}
                        bg={selectBg}
                      >
                        <option value="playing">{t('playing')}</option>
                        <option value="completed">{t('completed')}</option>
                        <option value="to_play">{t('toPlay')}</option>
                        <option value="dropped">{t('dropped')}</option>
                      </Select>
                      <Button
                        colorScheme="red"
                        variant="outline"
                        width="full"
                        leftIcon={<DeleteIcon />}
                        onClick={handleRemoveFromLibrary}
                      >
                        {t('remove')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Heading size="sm" mb={3}>
                        Ajouter à ma bibliothèque
                      </Heading>
                      <Select
                        value={libraryStatus}
                        onChange={(e) => setLibraryStatus(e.target.value)}
                        mb={3}
                      >
                        <option value="playing">{t('playing')}</option>
                        <option value="completed">{t('completed')}</option>
                        <option value="to_play">{t('toPlay')}</option>
                        <option value="dropped">{t('dropped')}</option>
                      </Select>
                      <Button
                        colorScheme="blue"
                        width="full"
                        leftIcon={<AddIcon />}
                        onClick={handleAddToLibrary}
                      >
                        {t('add')}
                      </Button>
                    </>
                  )}
                </Box>
              )}

              <Box p={4} borderWidth={1} borderRadius="md" bg={infoCardBg} borderColor={infoCardBorder}>
                <VStack align="stretch" spacing={3}>
                  {game.developers && game.developers.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color={metaText}>
                        Développeurs
                      </Text>
                      <Text>{game.developers.join(', ')}</Text>
                    </Box>
                  )}

                  {game.publishers && game.publishers.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color={metaText}>
                        Éditeurs
                      </Text>
                      <Text>{game.publishers.join(', ')}</Text>
                    </Box>
                  )}

                  {game.released && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color={metaText}>
                        Date de sortie
                      </Text>
                      <Text>{new Date(game.released).toLocaleDateString('fr-FR')}</Text>
                    </Box>
                  )}

                  {game.esrbRating && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color={metaText}>
                        Classification
                      </Text>
                      <Text>{game.esrbRating}</Text>
                    </Box>
                  )}

                  {game.website && (
                    <Box>
                      <Button
                        as="a"
                        href={game.website}
                        target="_blank"
                        colorScheme="gray"
                        size="sm"
                        width="full"
                      >
                        Site officiel
                      </Button>
                    </Box>
                  )}
                </VStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>

        {/* Section des avis */}
        <Box mt={12}>
          <ReviewSection contentId={game.externalId.toString()} />
        </Box>
      </Container>
    </Box>
  );
};

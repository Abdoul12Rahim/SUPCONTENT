import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  VStack,
  HStack,
  Progress,
  Badge,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  useColorModeValue,
  Icon,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import { achievementService, UserAchievement, AchievementStats } from '../services/achievementService';
import { useAuth } from '../contexts/AuthContext';

const rarityColors = {
  common: 'gray',
  rare: 'blue',
  epic: 'purple',
  legendary: 'orange',
};

const categoryLabels = {
  collection: 'Collection',
  review: 'Critiques',
  social: 'Social',
  special: 'Spécial',
};

const AchievementCard = ({ userAchievement }: { userAchievement: UserAchievement }) => {
  const { achievement, progress, isUnlocked, unlockedAt } = userAchievement;
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const progressPercentage = (progress / achievement.condition.value) * 100;

  return (
    <Box
      bg={cardBg}
      p={6}
      borderRadius="lg"
      border="1px"
      borderColor={isUnlocked ? rarityColors[achievement.rarity] : borderColor}
      opacity={isUnlocked ? 1 : 0.7}
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
    >
      <VStack align="stretch" spacing={3}>
        <Flex justify="space-between" align="start">
          <HStack>
            <Text fontSize="3xl">{achievement.icon}</Text>
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="lg">
                {achievement.name}
              </Text>
              <Badge colorScheme={rarityColors[achievement.rarity]}>
                {achievement.rarity.toUpperCase()}
              </Badge>
            </VStack>
          </HStack>
          {isUnlocked && (
            <Tooltip label={`Débloqué le ${new Date(unlockedAt!).toLocaleDateString()}`}>
              <Text fontSize="2xl">✓</Text>
            </Tooltip>
          )}
        </Flex>

        <Text fontSize="sm" color="gray.600">
          {achievement.description}
        </Text>

        <HStack justify="space-between" fontSize="sm">
          <Badge colorScheme="green">{achievement.points} points</Badge>
          <Badge>{categoryLabels[achievement.category]}</Badge>
        </HStack>

        {!isUnlocked && (
          <Box>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="xs" color="gray.500">
                Progression
              </Text>
              <Text fontSize="xs" fontWeight="bold">
                {progress} / {achievement.condition.value}
              </Text>
            </Flex>
            <Progress
              value={progressPercentage}
              size="sm"
              colorScheme={rarityColors[achievement.rarity]}
              borderRadius="full"
            />
          </Box>
        )}

        {isUnlocked && unlockedAt && (
          <Text fontSize="xs" color="green.500">
            Débloqué il y a {getRelativeTime(new Date(unlockedAt))}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'quelques instants';
};

export const Achievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const statBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [achievementsData, statsData] = await Promise.all([
        achievementService.getMyAchievements(),
        achievementService.getMyStats(),
      ]);
      setAchievements(achievementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter((ua) => {
    // Filtre par statut
    if (filter === 'unlocked' && !ua.isUnlocked) return false;
    if (filter === 'locked' && ua.isUnlocked) return false;

    // Filtre par catégorie
    if (categoryFilter !== 'all' && ua.achievement.category !== categoryFilter) return false;

    return true;
  });

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Chargement...</Text>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="2xl" mb={2}>
              🏆 Achievements
            </Heading>
            <Text color="gray.600">
              Débloquez des badges en jouant et en interagissant avec la communauté
            </Text>
          </Box>

          {/* Statistiques */}
          {stats && (
            <StatGroup
              bg={statBg}
              p={6}
              borderRadius="lg"
              shadow="sm"
              display="grid"
              gridTemplateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }}
              gap={6}
            >
              <Stat>
                <StatLabel>Total Achievements</StatLabel>
                <StatNumber>{stats.totalAchievements}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Débloqués</StatLabel>
                <StatNumber color="green.500">{stats.unlockedCount}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Points Totaux</StatLabel>
                <StatNumber color="orange.500">{stats.totalPoints}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Complétion</StatLabel>
                <StatNumber>{stats.completionRate.toFixed(1)}%</StatNumber>
                <Progress
                  value={stats.completionRate}
                  size="sm"
                  colorScheme="green"
                  borderRadius="full"
                  mt={2}
                />
              </Stat>
            </StatGroup>
          )}

          {/* Filtres */}
          <Box bg={statBg} p={4} borderRadius="lg" shadow="sm">
            <VStack spacing={4} align="stretch">
              <HStack spacing={2} flexWrap="wrap">
                <Text fontWeight="bold" fontSize="sm">
                  Statut:
                </Text>
                <Button
                  size="sm"
                  variant={filter === 'all' ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => setFilter('all')}
                >
                  Tous
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'unlocked' ? 'solid' : 'outline'}
                  colorScheme="green"
                  onClick={() => setFilter('unlocked')}
                >
                  Débloqués
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'locked' ? 'solid' : 'outline'}
                  colorScheme="gray"
                  onClick={() => setFilter('locked')}
                >
                  Verrouillés
                </Button>
              </HStack>

              <HStack spacing={2} flexWrap="wrap">
                <Text fontWeight="bold" fontSize="sm">
                  Catégorie:
                </Text>
                <Button
                  size="sm"
                  variant={categoryFilter === 'all' ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => setCategoryFilter('all')}
                >
                  Toutes
                </Button>
                <Button
                  size="sm"
                  variant={categoryFilter === 'collection' ? 'solid' : 'outline'}
                  colorScheme="purple"
                  onClick={() => setCategoryFilter('collection')}
                >
                  📚 Collection
                </Button>
                <Button
                  size="sm"
                  variant={categoryFilter === 'review' ? 'solid' : 'outline'}
                  colorScheme="orange"
                  onClick={() => setCategoryFilter('review')}
                >
                  ✍️ Critiques
                </Button>
                <Button
                  size="sm"
                  variant={categoryFilter === 'social' ? 'solid' : 'outline'}
                  colorScheme="pink"
                  onClick={() => setCategoryFilter('social')}
                >
                  👥 Social
                </Button>
                <Button
                  size="sm"
                  variant={categoryFilter === 'special' ? 'solid' : 'outline'}
                  colorScheme="yellow"
                  onClick={() => setCategoryFilter('special')}
                >
                  ⭐ Spécial
                </Button>
              </HStack>
            </VStack>
          </Box>

          {/* Grille d'achievements */}
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={6}
          >
            {filteredAchievements.map((ua) => (
              <AchievementCard key={ua.achievement._id} userAchievement={ua} />
            ))}
          </Grid>

          {filteredAchievements.length === 0 && (
            <Text textAlign="center" color="gray.500" py={8}>
              Aucun achievement trouvé avec ces filtres
            </Text>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

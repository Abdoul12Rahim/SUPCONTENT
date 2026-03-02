import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Grid,
  HStack,
  Text,
  Badge,
  VStack,
  Button,
  Flex,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { achievementService, UserAchievement, AchievementStats } from '../../services/achievementService';
import { useNavigate } from 'react-router-dom';

interface AchievementsSectionProps {
  userId: string;
  isOwnProfile?: boolean;
}

const rarityColors = {
  common: 'gray',
  rare: 'blue',
  epic: 'purple',
  legendary: 'orange',
};

export const AchievementsSection = ({ userId, isOwnProfile }: AchievementsSectionProps) => {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      const [achievementsData, statsData] = await Promise.all([
        achievementService.getUserAchievements(userId),
        achievementService.getUserStats(userId),
      ]);
      
      // Prendre seulement les 6 achievements débloqués les plus récents
      const unlockedAchievements = achievementsData
        .filter((ua) => ua.isUnlocked)
        .sort((a, b) => {
          const dateA = new Date(a.unlockedAt || 0);
          const dateB = new Date(b.unlockedAt || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 6);

      setAchievements(unlockedAchievements);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text>Chargement des achievements...</Text>;
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">🏆 Achievements</Heading>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="blue"
          onClick={() => navigate(isOwnProfile ? '/achievements' : `/achievements/${userId}`)}
        >
          Voir tous
        </Button>
      </Flex>

      {stats && (
        <HStack spacing={6} mb={6} flexWrap="wrap">
          <Box>
            <Text fontSize="sm" color="gray.600">
              Débloqués
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.500">
              {stats.unlockedCount} / {stats.totalAchievements}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600">
              Points
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="orange.500">
              {stats.totalPoints}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600">
              Complétion
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
              {stats.completionRate.toFixed(0)}%
            </Text>
          </Box>
        </HStack>
      )}

      {achievements.length > 0 ? (
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={4}>
          {achievements.map((ua) => (
            <Tooltip
              key={ua.achievement._id}
              label={
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">{ua.achievement.name}</Text>
                  <Text fontSize="sm">{ua.achievement.description}</Text>
                  <HStack>
                    <Badge colorScheme={rarityColors[ua.achievement.rarity]}>
                      {ua.achievement.rarity}
                    </Badge>
                    <Badge colorScheme="green">{ua.achievement.points} points</Badge>
                  </HStack>
                  {ua.unlockedAt && (
                    <Text fontSize="xs" color="gray.400">
                      {new Date(ua.unlockedAt).toLocaleDateString()}
                    </Text>
                  )}
                </VStack>
              }
              placement="top"
            >
              <Box
                bg={cardBg}
                p={4}
                borderRadius="lg"
                border="2px"
                borderColor={rarityColors[ua.achievement.rarity]}
                textAlign="center"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.05)', shadow: 'md' }}
              >
                <Text fontSize="3xl" mb={2}>
                  {ua.achievement.icon}
                </Text>
                <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                  {ua.achievement.name}
                </Text>
              </Box>
            </Tooltip>
          ))}
        </Grid>
      ) : (
        <Text color="gray.500" textAlign="center" py={6}>
          Aucun achievement débloqué pour le moment
        </Text>
      )}
    </Box>
  );
};

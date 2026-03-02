import { Box, Image, Text, Badge, HStack, VStack, Icon } from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

interface GameCardProps {
  id: string;
  title: string;
  slug: string;
  image?: string;
  rating?: number;
  releaseDate?: string;
  genres?: string[];
  platforms?: string[];
}

export const GameCard = ({ id, title, slug, image, rating, releaseDate, genres, platforms }: GameCardProps) => {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  
  return (
    <Link to={`/game/${id}`}>
      <Box
        borderRadius="xl"
        overflow="hidden"
        bg="white"
        transition="all 0.3s"
        _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
        cursor="pointer"
        shadow="md"
      >
        <Box position="relative">
          <Image
            src={image || 'https://via.placeholder.com/400x225?text=No+Image'}
            alt={title}
            h="250px"
            w="100%"
            objectFit="cover"
          />
          {year && (
            <Badge
              position="absolute"
              top={3}
              right={3}
              bg="rgba(0, 0, 0, 0.7)"
              color="white"
              px={3}
              py={1}
              borderRadius="md"
              fontSize="sm"
              fontWeight="bold"
            >
              🎮 {year}
            </Badge>
          )}
        </Box>
        
        <VStack align="stretch" p={5} spacing={3}>
          <Text fontWeight="bold" fontSize="lg" noOfLines={2} minH="3em">
            {title}
          </Text>
          
          <HStack justify="space-between" align="center">
            {rating && (
              <HStack spacing={1}>
                <Icon as={StarIcon} color="yellow.400" boxSize={4} />
                <Text fontWeight="semibold" fontSize="md">{rating.toFixed(1)}</Text>
              </HStack>
            )}
            
            {releaseDate && (
              <Text fontSize="xs" color="gray.500">
                {new Date(releaseDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            )}
          </HStack>
          
          {genres && genres.length > 0 && (
            <HStack spacing={2} flexWrap="wrap">
              {genres.slice(0, 2).map((genre, index) => (
                <Badge key={index} colorScheme="purple" fontSize="xs" px={2} py={1} borderRadius="md">
                  {genre}
                </Badge>
              ))}
            </HStack>
          )}
        </VStack>
      </Box>
    </Link>
  );
};

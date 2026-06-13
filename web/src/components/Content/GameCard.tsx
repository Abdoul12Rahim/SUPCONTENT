import { Box, Image, Text, Badge, HStack, VStack, Icon } from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { useState } from 'react';

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
  const cardBg = 'ui.card';
  const releaseText = 'ui.mutetext';
  const [imgError, setImgError] = useState(false);
  const fallbackImage = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80';
  const imageSrc = !imgError && image ? image : fallbackImage;
  
  return (
    <Link to={`/game/${slug || id}`}>
      <Box
        borderRadius="xl"
        overflow="hidden"
        bg={cardBg}
        transition="all 0.3s"
        _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
        cursor="pointer"
        shadow="md"
        border="1px solid"
        borderColor="ui.border"
      >
        <Box position="relative">
          <Image
            src={imageSrc}
            alt={title}
            h="250px"
            w="100%"
            objectFit="cover"
            onError={() => setImgError(true)}
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
          <Text fontWeight="bold" fontSize="lg" color="ui.text" noOfLines={2} minH="3em">
            {title}
          </Text>
          
          <HStack justify="space-between" align="center">
            {rating && (
              <HStack spacing={1}>
                <Icon as={StarIcon} color="yellow.400" boxSize={4} />
                <Text fontWeight="semibold" fontSize="md" color="ui.text">{rating.toFixed(1)}</Text>
              </HStack>
            )}
            
            {releaseDate && (
              <Text fontSize="xs" color={releaseText}>
                {new Date(releaseDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            )}
          </HStack>
          
          {genres && genres.length > 0 && (
            <HStack spacing={2} flexWrap="wrap">
              {genres.slice(0, 2).map((genre, index) => (
                <Badge
                  key={index}
                  bg="brand.100"
                  color="brand.700"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
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

import { Box, Container, Heading, Text, Button, VStack, Spinner, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collaborativeListAPI } from '../services/api';

export const JoinCollaborativeList = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [listInfo, setListInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Rediriger vers login, puis revenir ici après connexion
      navigate(`/login?redirect=/collaborative-lists/join/${inviteCode}`);
      return;
    }

    handleJoinList();
  }, [inviteCode, isAuthenticated]);

  const handleJoinList = async () => {
    try {
      setLoading(true);
      const response = await collaborativeListAPI.joinListByCode(inviteCode!);
      
      setListInfo(response.data.list);

      toast({
        title: 'Succès',
        description: response.data.message || 'Vous avez rejoint la liste avec succès',
        status: 'success',
        duration: 3000,
      });

      // Rediriger vers la liste après 2 secondes
      setTimeout(() => {
        navigate(`/collaborative-lists/${response.data.list._id}`);
      }, 2000);
    } catch (error: any) {
      console.error('Erreur:', error);
      
      let errorMessage = 'Code d\'invitation invalide';
      
      if (error.response?.status === 400 && error.response?.data?.list) {
        // L'utilisateur est déjà membre, rediriger vers la liste
        errorMessage = error.response.data.message;
        setListInfo(error.response.data.list);
        
        toast({
          title: 'Information',
          description: errorMessage,
          status: 'info',
          duration: 3000,
        });

        setTimeout(() => {
          navigate(`/collaborative-lists/${error.response.data.list._id}`);
        }, 2000);
        return;
      }
      
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.md" py={20}>
        <VStack spacing={6} align="center">
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Heading size="md">Rejoindre la liste...</Heading>
          <Text color="gray.600">Veuillez patienter</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.md" py={20}>
        <VStack spacing={6} align="center">
          <Box fontSize="5xl">❌</Box>
          <Heading size="lg">Code invalide</Heading>
          <Text color="gray.600" textAlign="center">
            {error}
          </Text>
          <Button colorScheme="blue" onClick={() => navigate('/collaborative-lists')}>
            Voir les listes publiques
          </Button>
        </VStack>
      </Container>
    );
  }

  if (listInfo) {
    return (
      <Container maxW="container.md" py={20}>
        <VStack spacing={6} align="center">
          <Box fontSize="5xl">✅</Box>
          <Heading size="lg">Bienvenue !</Heading>
          <Text color="gray.600" textAlign="center">
            Vous avez rejoint la liste <strong>"{listInfo.name}"</strong>
          </Text>
          <Text fontSize="sm" color="gray.500">
            Redirection en cours...
          </Text>
        </VStack>
      </Container>
    );
  }

  return null;
};

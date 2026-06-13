import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  VStack, 
  Heading, 
  Text,
  useToast,
  Link as ChakraLink
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 8 caractères',
        status: 'warning',
        duration: 5000,
      });
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      toast({
        title: 'Inscription réussie',
        status: 'success',
        duration: 3000,
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erreur d\'inscription',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxW="md"
      mx="auto"
      mt={8}
      p={6}
      borderWidth={1}
      borderRadius="lg"
      bg="ui.card"
      borderColor="ui.border"
      color="ui.text"
    >
      <VStack spacing={4} as="form" onSubmit={handleSubmit} autoComplete="off">
        <Heading size="lg">Inscription</Heading>
        
        <FormControl isRequired>
          <FormLabel>Nom d'utilisateur</FormLabel>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="pseudo123"
            autoComplete="off"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            autoComplete="off"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Mot de passe</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <Text fontSize="xs" color="ui.mutetext" mt={1}>
            Minimum 8 caractères
          </Text>
        </FormControl>

        <Button type="submit" bg="#7c3aed" color="white" width="full" isLoading={loading} _hover={{ bg: '#6d28d9' }}>
          S'inscrire
        </Button>

        <Text fontSize="sm">
          Déjà un compte ?{' '}
          <ChakraLink as={Link} to="/login" color="#a78bfa">
            Se connecter
          </ChakraLink>
        </Text>
      </VStack>
    </Box>
  );
};

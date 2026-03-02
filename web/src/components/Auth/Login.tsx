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

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast({
        title: 'Connexion réussie',
        status: 'success',
        duration: 3000,
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={4} as="form" onSubmit={handleSubmit} autoComplete="off">
        <Heading size="lg">Connexion</Heading>
        
        <FormControl isRequired>
          <FormLabel>Email ou nom d'utilisateur</FormLabel>
          <Input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com ou pseudo"
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
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          isLoading={loading}
        >
          Se connecter
        </Button>

        <Text fontSize="sm">
          Pas encore de compte ?{' '}
          <ChakraLink as={Link} to="/register" color="blue.500">
            S'inscrire
          </ChakraLink>
        </Text>
      </VStack>
    </Box>
  );
};

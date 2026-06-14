import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Divider,
  useToast,
  Textarea,
  Avatar,
  HStack,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import { EditIcon, CloseIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

export const Settings = () => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour le profil
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // États pour les préférences de notification
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifRecommendations, setNotifRecommendations] = useState(false);
  const [notifNewsletter, setNotifNewsletter] = useState(false);

  // États pour la confidentialité
  const [publicProfile, setPublicProfile] = useState(true);
  const [publicLibrary, setPublicLibrary] = useState(true);
  const [publicReviews, setPublicReviews] = useState(true);
  const [defaultListPublic, setDefaultListPublic] = useState(false);
  const cardBg = useColorModeValue('white', 'gray.800');
  const tabBg = useColorModeValue('gray.50', 'gray.700');
  const tabSelectedBg = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const surfaceBg = useColorModeValue('gray.50', 'gray.900');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const bodyText = useColorModeValue('gray.700', 'gray.200');
  const dangerBg = useColorModeValue('red.50', 'red.900');
  const dangerBorder = useColorModeValue('red.200', 'red.700');

  // Rediriger vers l'accueil si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour accéder aux paramètres',
        status: 'warning',
        duration: 3000,
      });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar || '');
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Heading mb={4}>Paramètres</Heading>
          <Text>Veuillez vous connecter pour accéder aux paramètres</Text>
        </Box>
      </Container>
    );
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile({
        username,
        displayName,
        bio,
        avatar: avatarUrl,
        language,
      });
      
      // Mettre à jour le contexte utilisateur
      updateUser(response.data);
      
      toast({
        title: 'Profil mis à jour',
        description: 'Vos modifications ont été enregistrées',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de mettre à jour le profil',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer votre mot de passe actuel',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 8 caractères',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: 'Erreur',
        description: 'Le nouveau mot de passe doit être différent de l\'ancien',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      setPasswordLoading(true);
      await authAPI.changePassword({ 
        currentPassword,
        newPassword 
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été changé avec succès',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de changer le mot de passe',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image valide',
        status: 'error',
        duration: 4000,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'La taille maximale est de 5MB',
        status: 'error',
        duration: 4000,
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await authAPI.uploadAvatar(formData);
      const uploadedAvatar = response.data?.avatar;
      if (uploadedAvatar) {
        const avatarWithVersion = `${uploadedAvatar}${uploadedAvatar.includes('?') ? '&' : '?'}v=${Date.now()}`;
        setAvatarUrl(avatarWithVersion);
        updateUser({ ...user, avatar: avatarWithVersion });
        toast({
          title: 'Photo mise à jour',
          description: 'Votre photo de profil a été changée',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de téléverser la photo',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLanguageChange = async (nextLanguage: 'fr' | 'en' | 'es') => {
    try {
      setLanguage(nextLanguage);
      await authAPI.updateProfile({ language: nextLanguage });
      updateUser({ ...user, language: nextLanguage } as any);
      toast({
        title: 'Langue mise à jour',
        description: 'La langue de l\'interface a été modifiée',
        status: 'success',
        duration: 2500,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de changer la langue',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg">Paramètres</Heading>
          <Text color={mutedText} mt={1}>Gérez votre compte et vos préférences</Text>
        </Box>

        <Tabs colorScheme="gray" variant="soft-rounded">
          <TabList bg={tabBg} p={2} borderRadius="lg" flexWrap="wrap">
            <Tab _selected={{ bg: tabSelectedBg, fontWeight: 'semibold' }}>
              👤 Profil
            </Tab>
            <Tab _selected={{ bg: tabSelectedBg, fontWeight: 'semibold' }}>
              🔔 Notifications
            </Tab>
            <Tab _selected={{ bg: tabSelectedBg, fontWeight: 'semibold' }}>
              🔒 Confidentialité
            </Tab>
            <Tab _selected={{ bg: tabSelectedBg, fontWeight: 'semibold' }}>
              📥 Données
            </Tab>
          </TabList>

          <TabPanels>
            {/* Onglet Profil */}
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                {/* Informations du profil */}
                <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="md" mb={1}>Informations du profil</Heading>
                      <Text fontSize="sm" color={mutedText}>Mettez à jour vos informations personnelles</Text>
                    </Box>

                    {/* Avatar */}
                    <HStack spacing={4} pt={4}>
                      <Avatar 
                        size="xl" 
                        name={displayName || username}
                        src={getAvatarUrl(avatarUrl)}
                      />
                      <Button size="sm" variant="outline" onClick={handleAvatarClick} isLoading={loading}>
                        Changer la photo
                      </Button>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        display="none"
                      />
                    </HStack>

                    <FormControl>
                      <FormLabel fontWeight="medium">Nom d'utilisateur</FormLabel>
                      <Input 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        bg={inputBg}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Email</FormLabel>
                      <Input 
                        value={user?.email || ''} 
                        type="email" 
                        isDisabled 
                        bg={inputBg}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Biographie</FormLabel>
                      <Textarea 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Bienvenue sur mon profil !" 
                        rows={3}
                        bg={inputBg}
                      />
                    </FormControl>

                    <Button 
                      bg="black" 
                      color="white"
                      _hover={{ bg: 'gray.800' }}
                      onClick={handleSaveProfile}
                      isLoading={loading}
                      alignSelf="flex-start"
                      px={8}
                    >
                      Enregistrer les modifications
                    </Button>
                  </VStack>
                </Box>

                {/* Changement de mot de passe */}
                <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="md" mb={1}>Mot de passe</Heading>
                      <Text fontSize="sm" color={mutedText}>Modifiez votre mot de passe</Text>
                    </Box>

                    <FormControl>
                      <FormLabel fontWeight="medium">Mot de passe actuel</FormLabel>
                      <Input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        bg={inputBg}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Nouveau mot de passe</FormLabel>
                      <Input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        bg={inputBg}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Confirmer le mot de passe</FormLabel>
                      <Input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        bg={inputBg}
                      />
                    </FormControl>

                    <Button 
                      bg="black" 
                      color="white"
                      _hover={{ bg: 'gray.800' }}
                      onClick={handleChangePassword}
                      isLoading={passwordLoading}
                      isDisabled={!currentPassword || !newPassword || !confirmPassword}
                      alignSelf="flex-start"
                      px={8}
                    >
                      Modifier le mot de passe
                    </Button>
                  </VStack>
                </Box>

                {/* Langue */}
                <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="md" mb={1}>Langue</Heading>
                      <Text fontSize="sm" color={mutedText}>Choisissez votre langue préférée</Text>
                    </Box>

                    <FormControl>
                      <FormLabel fontWeight="medium">Langue de l'interface</FormLabel>
                      <Select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value as 'fr' | 'en' | 'es')}
                        bg={inputBg}
                        fontWeight="medium"
                      >
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="es">🇪🇸 Español</option>
                      </Select>
                    </FormControl>
                  </VStack>
                </Box>
              </VStack>
            </TabPanel>

            {/* Onglet Notifications */}
            <TabPanel px={0}>
              <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={1}>Préférences de notification</Heading>
                    <Text fontSize="sm" color={mutedText}>Choisissez comment vous souhaitez être notifié</Text>
                  </Box>

                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between" py={2}>
                      <Box>
                        <Text fontWeight="medium">Nouveaux likes</Text>
                        <Text fontSize="sm" color={mutedText}>Recevez une notification quand quelqu'un aime votre critique</Text>
                      </Box>
                      <Switch 
                        size="lg" 
                        isChecked={notifLikes}
                        onChange={(e) => setNotifLikes(e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>

                    <Divider />

                    <HStack justify="space-between" py={2}>
                      <Box>
                        <Text fontWeight="medium">Nouveaux commentaires</Text>
                        <Text fontSize="sm" color={mutedText}>Recevez une notification pour les nouveaux commentaires</Text>
                      </Box>
                      <Switch 
                        size="lg" 
                        isChecked={notifComments}
                        onChange={(e) => setNotifComments(e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>

                    <Divider />

                    <HStack justify="space-between" py={2}>
                      <Box>
                        <Text fontWeight="medium">Nouveaux abonnés</Text>
                        <Text fontSize="sm" color={mutedText}>Soyez notifié quand quelqu'un vous suit</Text>
                      </Box>
                      <Switch 
                        size="lg" 
                        isChecked={notifFollows}
                        onChange={(e) => setNotifFollows(e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>

                    <Divider />

                    <HStack justify="space-between" py={2}>
                      <Box>
                        <Text fontWeight="medium">Recommandations</Text>
                        <Text fontSize="sm" color={mutedText}>Recevez des suggestions d'œuvres basées sur vos goûts</Text>
                      </Box>
                      <Switch 
                        size="lg" 
                        isChecked={notifRecommendations}
                        onChange={(e) => setNotifRecommendations(e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>

                    <Divider />

                    <HStack justify="space-between" py={2}>
                      <Box>
                        <Text fontWeight="medium">Newsletter</Text>
                        <Text fontSize="sm" color={mutedText}>Recevez notre newsletter hebdomadaire</Text>
                      </Box>
                      <Switch 
                        size="lg" 
                        isChecked={notifNewsletter}
                        onChange={(e) => setNotifNewsletter(e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                  </VStack>
                </VStack>
              </Box>
            </TabPanel>

            {/* Onglet Confidentialité */}
            <TabPanel px={0}>
              <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={1}>Confidentialité</Heading>
                    <Text fontSize="sm" color={mutedText}>Gérez la visibilité de votre profil et de vos données</Text>
                  </Box>

                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between" py={2}>
                      <Box>
                        <Text fontWeight="medium">Profil public</Text>
                        <Text fontSize="sm" color={mutedText}>Votre profil est visible par tous les utilisateurs</Text>
                      </Box>
                      <Switch 
                        size="lg" 
                        isChecked={publicProfile}
                        onChange={(e) => setPublicProfile(e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>

                    <Divider />

                    <HStack justify="space-between" py={2}>
                      <Box>
                        <Text fontWeight="medium">Bibliothèque publique</Text>
                        <Text fontSize="sm" color={mutedText}>Les autres peuvent voir vos œuvres</Text>
                      </Box>
                      <Switch 
                        size="lg" 
                        isChecked={publicLibrary}
                        onChange={(e) => setPublicLibrary(e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>

                    <Divider />

                    <HStack justify="space-between" py={2}>
                      <Box>
                        <Text fontWeight="medium">Critiques publiques</Text>
                        <Text fontSize="sm" color={mutedText}>Vos critiques sont visibles par tous</Text>
                      </Box>
                      <Switch 
                        size="lg" 
                        isChecked={publicReviews}
                        onChange={(e) => setPublicReviews(e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>

                    <Divider />

                    <HStack justify="space-between" py={2}>
                      <Box>
                        <Text fontWeight="medium">Listes publiques par défaut</Text>
                        <Text fontSize="sm" color={mutedText}>Les nouvelles listes sont publiques</Text>
                      </Box>
                      <Switch 
                        size="lg" 
                        isChecked={defaultListPublic}
                        onChange={(e) => setDefaultListPublic(e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                  </VStack>
                </VStack>
              </Box>
            </TabPanel>

            {/* Onglet Données */}
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="md" mb={1}>Exporter vos données</Heading>
                      <Text fontSize="sm" color={mutedText}>Téléchargez une copie de toutes vos données</Text>
                    </Box>

                    <Button 
                      leftIcon={<Text>📥</Text>}
                      variant="outline"
                      alignSelf="flex-start"
                    >
                      Télécharger mes données
                    </Button>
                  </VStack>
                </Box>

                <Box bg={dangerBg} p={6} borderRadius="lg" border="1px" borderColor={dangerBorder}>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={1} color={useColorModeValue('red.600', 'red.300')}>Zone de danger</Heading>
                      <Text fontSize="sm" color={useColorModeValue('red.700', 'red.200')}>Actions irréversibles sur votre compte</Text>
                    </Box>

                    <Divider borderColor={dangerBorder} />

                    <Box>
                      <Text fontWeight="medium" mb={2}>Supprimer toutes mes critiques</Text>
                      <Button 
                        colorScheme="red"
                        variant="outline"
                        size="sm"
                      >
                        Supprimer les critiques
                      </Button>
                    </Box>

                    <Divider borderColor={dangerBorder} />

                    <Box>
                      <Text fontWeight="medium" mb={1}>Supprimer mon compte</Text>
                      <Text fontSize="sm" color={useColorModeValue('red.700', 'red.200')} mb={3}>
                        Cette action est définitive et supprimera toutes vos données
                      </Text>
                      <Button 
                        colorScheme="red"
                        leftIcon={<CloseIcon />}
                        size="sm"
                      >
                        Supprimer mon compte
                      </Button>
                    </Box>
                  </VStack>
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

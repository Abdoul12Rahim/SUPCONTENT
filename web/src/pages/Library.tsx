import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  SimpleGrid,
  useToast,
  HStack,
  Button,
  Icon,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Switch,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { ViewIcon, AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { libraryAPI, listAPI } from '../services/api';
import { GameCard } from '../components/Content/GameCard';
import { Loading } from '../components/Common/Loading';

interface LibraryGame {
  _id: string;
  content: {
    _id: string;
    externalId: number;
    slug: string;
    title: string;
    backgroundImage?: string;
    rating?: number;
    released?: string;
    genres?: string[];
    platforms?: string[];
  };
  status: string;
  rating?: number;
  hoursPlayed?: number;
}

type TabStatus = 'to_play' | 'playing' | 'completed' | 'dropped' | 'lists';

interface CustomList {
  _id: string;
  name: string;
  description?: string;
  items: any[];
  createdAt: string;
}

export const Library = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [games, setGames] = useState<LibraryGame[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('to_play');
  const [counts, setCounts] = useState({
    to_play: 0,
    playing: 0,
    completed: 0,
    dropped: 0,
    lists: 0
  });
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isPublicList, setIsPublicList] = useState(false);
  const [editingList, setEditingList] = useState<CustomList | null>(null);
  const [listToDelete, setListToDelete] = useState<CustomList | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef(null);
  const toast = useToast();

  // Rediriger vers l'accueil si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/');
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour accéder à votre collection',
        status: 'warning',
        duration: 3000,
      });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLibrary(activeTab);
      fetchCounts();
    }
  }, [isAuthenticated, activeTab]);

  // Mettre à jour le compteur des listes quand customLists change
  useEffect(() => {
    setCounts(prev => ({ ...prev, lists: customLists.length }));
  }, [customLists]);

  // Écouter les changements de bibliothèque depuis d'autres pages
  useEffect(() => {
    const handleLibraryUpdate = () => {
      fetchCounts();
      if (activeTab !== 'lists') {
        fetchLibrary(activeTab);
      }
    };

    window.addEventListener('libraryUpdated', handleLibraryUpdate);
    return () => window.removeEventListener('libraryUpdated', handleLibraryUpdate);
  }, [activeTab]);

  const fetchCounts = async () => {
    try {
      // Récupérer les compteurs pour chaque statut en parallèle
      const [toPlayRes, playingRes, completedRes, droppedRes] = await Promise.all([
        libraryAPI.getMy('to_play', 1),
        libraryAPI.getMy('playing', 1),
        libraryAPI.getMy('completed', 1),
        libraryAPI.getMy('dropped', 1),
      ]);

      setCounts({
        to_play: toPlayRes.data.total || 0,
        playing: playingRes.data.total || 0,
        completed: completedRes.data.total || 0,
        dropped: droppedRes.data.total || 0,
        lists: customLists.length,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des compteurs:', error);
    }
  };

  const fetchLibrary = async (status: TabStatus) => {
    if (status === 'lists') {
      // Charger les listes personnelles depuis l'API
      try {
        setLoading(true);
        const response = await listAPI.getMyLists();
        setCustomLists(response.data.lists || []);
        setGames([]);
      } catch (error: any) {
        console.error('Erreur lors du chargement des listes:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les listes',
          status: 'error',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      const response = await libraryAPI.getMy(status);
      setGames(response.data.items || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la bibliothèque',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de la liste est requis',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      if (editingList) {
        // Mode édition
        await listAPI.updateList(editingList._id, {
          name: newListName,
          description: newListDescription,
          isPublic: isPublicList,
        });
        
        toast({
          title: 'Liste modifiée',
          description: `La liste '${newListName}' a été modifiée avec succès`,
          status: 'success',
          duration: 3000,
        });
      } else {
        // Mode création
        await listAPI.create({
          name: newListName,
          description: newListDescription,
          isPublic: isPublicList,
        });
        
        toast({
          title: 'Liste créée',
          description: `La liste '${newListName}' a été créée avec succès${isPublicList ? ' (publique)' : ''}`,
          status: 'success',
          duration: 3000,
        });
      }
      
      setNewListName('');
      setNewListDescription('');
      setIsPublicList(false);
      setEditingList(null);
      onClose();
      
      // Recharger les listes
      fetchLibrary('lists');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || (editingList ? 'Impossible de modifier la liste' : 'Impossible de créer la liste'),
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleEditList = (list: CustomList) => {
    setEditingList(list);
    setNewListName(list.name);
    setNewListDescription(list.description || '');
    setIsPublicList(false);
    onOpen();
  };

  const handleDeleteList = (list: CustomList) => {
    setListToDelete(list);
    onDeleteOpen();
  };

  const confirmDeleteList = async () => {
    if (listToDelete) {
      try {
        await listAPI.deleteList(listToDelete._id);
        
        toast({
          title: 'Liste supprimée',
          description: `La liste '${listToDelete.name}' a été supprimée`,
          status: 'info',
          duration: 3000,
        });
        
        setListToDelete(null);
        onDeleteClose();
        
        // Recharger les listes
        fetchLibrary('lists');
      } catch (error: any) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer la liste',
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  const handleCloseModal = () => {
    setNewListName('');
    setNewListDescription('');
    setIsPublicList(false);
    setEditingList(null);
    onClose();
  };

  if (!isAuthenticated) {
    return (
      <Container maxW='container.xl' py={8}>
        <Box textAlign='center'>
          <Heading mb={4}>Ma collection</Heading>
          <Text>Veuillez vous connecter pour voir votre bibliothèque</Text>
        </Box>
      </Container>
    );
  }

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'to_play':
        return 'Aucun jeu à jouer';
      case 'playing':
        return 'Aucun jeu en cours';
      case 'completed':
        return 'Aucun jeu terminé';
      case 'dropped':
        return 'Aucun jeu abandonné';
      case 'lists':
        return 'Aucune liste créée';
      default:
        return 'Aucun jeu';
    }
  };

  return (
    <Container maxW='container.xl' py={8}>
      <VStack spacing={6} align='stretch'>
        {/* En-tÃªte */}
        <Box>
          <Heading size='xl' mb={2} fontWeight='bold'>
            Ma collection
          </Heading>
          <Text fontSize='md' color='gray.600'>
            Gérez vos jeux et créez des listes personnelles. Pour des listes partagées, utilisez "Listes Partagées" dans le menu.
          </Text>
        </Box>

        {/* Onglets personnalisÃ©s */}
        <HStack 
          spacing={3} 
          bg='gray.50' 
          p={2} 
          borderRadius='full' 
          display='inline-flex'
          w='fit-content'
        >
          <Button
            size='md'
            variant={activeTab === 'to_play' ? 'solid' : 'ghost'}
            colorScheme='blue'
            bg={activeTab === 'to_play' ? 'blue.500' : 'transparent'}
            color={activeTab === 'to_play' ? 'white' : 'gray.700'}
            borderRadius='full'
            _hover={{
              bg: activeTab === 'to_play' ? 'blue.600' : 'gray.200'
            }}
            onClick={() => setActiveTab('to_play')}
          >
            À jouer ({counts.to_play})
          </Button>
          
          <Button
            size='md'
            variant={activeTab === 'playing' ? 'solid' : 'ghost'}
            colorScheme='yellow'
            bg={activeTab === 'playing' ? 'yellow.400' : 'transparent'}
            color={activeTab === 'playing' ? 'white' : 'gray.700'}
            borderRadius='full'
            _hover={{
              bg: activeTab === 'playing' ? 'yellow.500' : 'gray.200'
            }}
            onClick={() => setActiveTab('playing')}
          >
            En cours ({counts.playing})
          </Button>
          
          <Button
            size='md'
            variant={activeTab === 'completed' ? 'solid' : 'ghost'}
            colorScheme='green'
            bg={activeTab === 'completed' ? 'green.500' : 'transparent'}
            color={activeTab === 'completed' ? 'white' : 'gray.700'}
            borderRadius='full'
            _hover={{
              bg: activeTab === 'completed' ? 'green.600' : 'gray.200'
            }}
            onClick={() => setActiveTab('completed')}
          >
            Terminé ({counts.completed})
          </Button>
          
          <Button
            size='md'
            variant={activeTab === 'dropped' ? 'solid' : 'ghost'}
            colorScheme='red'
            bg={activeTab === 'dropped' ? 'red.500' : 'transparent'}
            color={activeTab === 'dropped' ? 'white' : 'gray.700'}
            borderRadius='full'
            _hover={{
              bg: activeTab === 'dropped' ? 'red.600' : 'gray.200'
            }}
            onClick={() => setActiveTab('dropped')}
          >
            Abandonné ({counts.dropped})
          </Button>
          
          <Button
            size='md'
            variant={activeTab === 'lists' ? 'solid' : 'ghost'}
            colorScheme='gray'
            bg={activeTab === 'lists' ? 'gray.700' : 'transparent'}
            color={activeTab === 'lists' ? 'white' : 'gray.700'}
            borderRadius='full'
            leftIcon={<Text fontSize='lg'>☰</Text>}
            _hover={{
              bg: activeTab === 'lists' ? 'gray.800' : 'gray.200'
            }}
            onClick={() => setActiveTab('lists')}
          >
            Mes Listes ({counts.lists})
          </Button>
        </HStack>

        {/* Contenu */}
        {activeTab === 'lists' && !loading && (
          <Button
            leftIcon={<AddIcon />}
            colorScheme='gray'
            bg='gray.900'
            color='white'
            size='lg'
            borderRadius='xl'
            _hover={{ bg: 'gray.800' }}
            onClick={onOpen}
            w='fit-content'
          >
            Créer une liste
          </Button>
        )}

        {loading ? (
          <Loading />
        ) : activeTab === 'lists' ? (
          customLists.length === 0 ? (
            <Center 
              minH='400px' 
              bg='white' 
              borderRadius='xl' 
              border='1px' 
              borderColor='gray.100'
            >
              <VStack spacing={4}>
                {/* IcÃ´ne de liste stylisÃ©e */}
                <Box
                  bg='gray.100'
                  borderRadius='lg'
                  p={6}
                >
                  <svg
                    width='80'
                    height='80'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    style={{ color: '#9CA3AF' }}
                  >
                    <line x1='8' y1='6' x2='21' y2='6' />
                    <line x1='8' y1='12' x2='21' y2='12' />
                    <line x1='8' y1='18' x2='21' y2='18' />
                    <line x1='3' y1='6' x2='3.01' y2='6' />
                    <line x1='3' y1='12' x2='3.01' y2='12' />
                    <line x1='3' y1='18' x2='3.01' y2='18' />
                  </svg>
                </Box>
                <Text fontSize='lg' color='gray.500' fontWeight='medium'>
                  Aucune liste personnalisée
                </Text>
                <Text fontSize='sm' color='gray.400' textAlign='center' maxW='400px'>
                  Créez des listes pour organiser vos jeux par thème
                </Text>
              </VStack>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {customLists.map((list) => (
                <Box
                  key={list._id}
                  bg='white'
                  borderRadius='xl'
                  p={6}
                  border='1px'
                  borderColor='gray.200'
                  transition='all 0.2s'
                  _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                  cursor='pointer'
                  onClick={() => navigate(`/list/${list._id}`)}
                >
                  <VStack align='stretch' spacing={3}>
                    <HStack justify='space-between'>
                      <Text fontSize='xl' fontWeight='bold'>
                        {list.name}
                      </Text>
                      <HStack spacing={1}>
                        <IconButton
                          aria-label='Modifier la liste'
                          icon={<EditIcon />}
                          size='sm'
                          variant='ghost'
                          colorScheme='blue'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditList(list);
                          }}
                        />
                        <IconButton
                          aria-label='Supprimer la liste'
                          icon={<DeleteIcon />}
                          size='sm'
                          variant='ghost'
                          colorScheme='red'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list);
                          }}
                        />
                      </HStack>
                    </HStack>
                    <Text fontSize='sm' color='gray.500'>
                      {list.items.length} jeux
                    </Text>
                    {list.description && (
                      <Text fontSize='sm' color='gray.600' noOfLines={2}>
                        {list.description}
                      </Text>
                    )}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          )
        ) : games.length === 0 ? (
          <Center 
            minH='400px' 
            bg='white' 
            borderRadius='xl' 
            border='1px' 
            borderColor='gray.100'
          >
            <VStack spacing={4}>
              {/* Icône de livre stylisée */}
              <Box
                bg='gray.100'
                borderRadius='lg'
                p={6}
              >
                <svg
                  width='80'
                  height='80'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  style={{ color: '#9CA3AF' }}
                >
                  <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' />
                  <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' />
                  <path d='M12 21V7' />
                  <path d='M6 6h.01M18 6h.01' />
                </svg>
              </Box>
              <Text fontSize='lg' color='gray.500' fontWeight='medium'>
                {getEmptyMessage()}
              </Text>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {games.map((item) => (
              <GameCard
                key={item._id}
                id={item.content.externalId.toString()}
                title={item.content.title}
                slug={item.content.slug}
                image={item.content.backgroundImage}
                rating={item.content.rating}
                releaseDate={item.content.released}
                genres={item.content.genres}
                platforms={item.content.platforms}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Modal de création/édition de liste */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size='lg'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingList ? 'Modifier ma liste' : 'Créer une liste personnelle'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align='stretch'>
              <FormControl isRequired>
                <FormLabel fontWeight='semibold'>Nom de la liste</FormLabel>
                <Input
                  placeholder='Ma liste de favoris'
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  size='lg'
                  borderRadius='lg'
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontWeight='semibold'>Description</FormLabel>
                <Textarea
                  placeholder='Description de votre liste...'
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows={3}
                  borderRadius='lg'
                  resize='none'
                />
              </FormControl>

              <FormControl>
                <HStack justify='space-between' py={2}>
                  <FormLabel fontWeight='semibold' mb={0}>Liste publique</FormLabel>
                  <Switch
                    size='lg'
                    colorScheme='gray'
                    isChecked={isPublicList}
                    onChange={(e) => setIsPublicList(e.target.checked)}
                  />
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter pt={6}>
            <Button 
              bg='gray.900'
              color='white'
              onClick={handleCreateList}
              isDisabled={!newListName.trim()}
              size='lg'
              w='full'
              borderRadius='lg'
              _hover={{ bg: 'gray.800' }}
            >
              {editingList ? 'Modifier la liste' : 'Créer la liste'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              Supprimer la liste
            </AlertDialogHeader>

            <AlertDialogBody>
              Êtes-vous sûr de vouloir supprimer la liste "{listToDelete?.name}" ? 
              Cette action est irréversible.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Annuler
              </Button>
              <Button colorScheme='red' onClick={confirmDeleteList} ml={3}>
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};


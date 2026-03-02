import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  useToast,
  IconButton,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Badge,
} from '@chakra-ui/react';
import { SearchIcon, DeleteIcon, ArrowBackIcon, SettingsIcon, EditIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listAPI, contentAPI } from '../services/api';
import { Loading } from '../components/Common/Loading';

interface Game {
  _id: string;
  externalId: number;
  title: string;
  slug: string;
  backgroundImage?: string;
  rating?: number;
  genres?: string[];
}

interface PersonalList {
  _id: string;
  name: string;
  description?: string;
  items: Game[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PersonalListDetail = () => {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [list, setList] = useState<PersonalList | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<Game | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteListOpen, onOpen: onDeleteListOpen, onClose: onDeleteListClose } = useDisclosure();
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const cancelRef = useRef(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (listId) {
      fetchList();
    }
  }, [listId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await listAPI.getList(listId!);
      setList(response.data);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste',
        status: 'error',
        duration: 5000,
      });
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await contentAPI.search(value, 1);
        setSearchResults(response.data.results || []);
        setShowResults(true);
      } catch (error) {
        console.error('Erreur de recherche:', error);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleAddGame = async (game: Game) => {
    try {
      await listAPI.addItem(listId!, game.externalId.toString());

      toast({
        title: 'Jeu ajouté',
        description: `${game.title} a été ajouté à la liste`,
        status: 'success',
        duration: 3000,
      });

      setSearchQuery('');
      setShowResults(false);
      fetchList();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible d\'ajouter le jeu',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleRemoveGameConfirm = (item: Game) => {
    setItemToRemove(item);
    onDeleteOpen();
  };

  const handleRemoveGame = async () => {
    if (!itemToRemove) return;

    try {
      await listAPI.removeItem(listId!, itemToRemove._id);
      
      toast({
        title: 'Jeu retiré',
        description: 'Le jeu a été retiré de la liste',
        status: 'success',
        duration: 3000,
      });

      setItemToRemove(null);
      onDeleteClose();
      fetchList();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le jeu',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleOpenEditModal = () => {
    if (!list) return;
    setEditName(list.name);
    setEditDescription(list.description || '');
    onEditOpen();
  };

  const handleUpdateList = async () => {
    if (!editName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de la liste est requis',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await listAPI.updateList(listId!, {
        name: editName,
        description: editDescription,
      });

      toast({
        title: 'Liste modifiée',
        description: 'La liste a été modifiée avec succès',
        status: 'success',
        duration: 3000,
      });

      onEditClose();
      fetchList();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de modifier la liste',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeleteList = async () => {
    try {
      await listAPI.deleteList(listId!);

      toast({
        title: 'Liste supprimée',
        description: 'La liste a été supprimée avec succès',
        status: 'success',
        duration: 3000,
      });

      navigate('/library');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer la liste',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!list) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Liste introuvable</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* En-tête */}
        <Box>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate('/library')}
            mb={4}
          >
            Retour à ma collection
          </Button>

          <HStack justify="space-between" mb={2}>
            <HStack spacing={3}>
              <Heading size="lg">{list.name}</Heading>
              {list.isPublic && (
                <Badge colorScheme="green">👁️ Publique</Badge>
              )}
            </HStack>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<SettingsIcon />}
                variant="ghost"
                aria-label="Options"
              />
              <MenuList>
                <MenuItem icon={<EditIcon />} onClick={handleOpenEditModal}>
                  Modifier la liste
                </MenuItem>
                <MenuItem icon={<DeleteIcon />} color="red.500" onClick={onDeleteListOpen}>
                  Supprimer la liste
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>

          {list.description && (
            <Text color="gray.600" mb={4}>{list.description}</Text>
          )}

          <Text fontSize="sm" color="gray.500">
            {list.items.length} jeu{list.items.length !== 1 ? 'x' : ''}
          </Text>
        </Box>

        {/* Recherche de jeux */}
        <Box bg="white" p={4} borderRadius="lg" shadow="sm" className="search-container" position="relative">
          <Heading size="md" mb={3}>➕ Ajouter un jeu</Heading>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher un jeu..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </InputGroup>

          {/* Résultats de recherche */}
          {showResults && (
            <Box
              position="absolute"
              top="105%"
              left={0}
              right={0}
              bg="white"
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
              shadow="lg"
              maxH="400px"
              overflowY="auto"
              zIndex={10}
            >
              {searching ? (
                <Box p={4} textAlign="center">
                  <Spinner size="sm" />
                  <Text ml={2} display="inline">Recherche...</Text>
                </Box>
              ) : searchResults.length === 0 ? (
                <Box p={4} textAlign="center">
                  <Text color="gray.500">Aucun résultat</Text>
                </Box>
              ) : (
                <VStack spacing={0} align="stretch">
                  {searchResults.map((game) => (
                    <Box
                      key={game.externalId}
                      p={3}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleAddGame(game)}
                      borderBottom="1px"
                      borderColor="gray.100"
                    >
                      <HStack spacing={3}>
                        {game.backgroundImage && (
                          <Box
                            w="60px"
                            h="60px"
                            borderRadius="md"
                            overflow="hidden"
                            flexShrink={0}
                          >
                            <img
                              src={game.backgroundImage}
                              alt={game.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                        )}
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="semibold" fontSize="sm">{game.title}</Text>
                          {game.genres && game.genres.length > 0 && (
                            <Text fontSize="xs" color="gray.500">
                              {game.genres.slice(0, 3).join(', ')}
                            </Text>
                          )}
                          {game.rating && (
                            <Badge colorScheme="green" fontSize="xs">
                              ⭐ {game.rating.toFixed(1)}
                            </Badge>
                          )}
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          )}
        </Box>

        {/* Liste des jeux */}
        {list.items.length === 0 ? (
          <Box bg="white" p={8} borderRadius="lg" textAlign="center">
            <Text color="gray.500">Aucun jeu dans cette liste</Text>
            <Text fontSize="sm" color="gray.400">
              Utilisez la recherche ci-dessus pour ajouter des jeux
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {list.items.map((game) => (
              <Box
                key={game._id}
                position="relative"
                bg="white"
                borderRadius="lg"
                overflow="hidden"
                shadow="md"
                transition="all 0.2s"
                _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
                cursor="pointer"
                onClick={() => navigate(`/game/${game.slug}`)}
              >
                {game.backgroundImage && (
                  <Box
                    h="200px"
                    bgImage={`url(${game.backgroundImage})`}
                    bgSize="cover"
                    bgPosition="center"
                    position="relative"
                  >
                    <IconButton
                      aria-label="Retirer"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      position="absolute"
                      top={2}
                      right={2}
                      opacity={0}
                      _groupHover={{ opacity: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGameConfirm(game);
                      }}
                      sx={{
                        '@media (hover: hover)': {
                          '.parent:hover &': { opacity: 1 }
                        }
                      }}
                    />
                  </Box>
                )}
                <Box p={4}>
                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                    {game.title}
                  </Text>
                  {game.genres && game.genres.length > 0 && (
                    <Text fontSize="sm" color="gray.500" noOfLines={1}>
                      {game.genres.slice(0, 2).join(', ')}
                    </Text>
                  )}
                  {game.rating && (
                    <Badge colorScheme="green" mt={2}>
                      ⭐ {game.rating.toFixed(1)}
                    </Badge>
                  )}
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Dialog de confirmation de suppression de jeu */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Retirer le jeu</AlertDialogHeader>
            <AlertDialogBody>
              Êtes-vous sûr de vouloir retirer "{itemToRemove?.title}" de la liste ?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Annuler
              </Button>
              <Button colorScheme="red" onClick={handleRemoveGame} ml={3}>
                Retirer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Dialog de confirmation de suppression de liste */}
      <AlertDialog
        isOpen={isDeleteListOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteListClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Supprimer la liste</AlertDialogHeader>
            <AlertDialogBody>
              Êtes-vous sûr de vouloir supprimer définitivement la liste "{list?.name}" ?
              Tous les jeux seront retirés de cette liste.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteListClose}>
                Annuler
              </Button>
              <Button colorScheme="red" onClick={handleDeleteList} ml={3}>
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Modal de modification de liste */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier la liste</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nom de la liste</FormLabel>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ma liste personnelle"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description de la liste..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateList}>
              Enregistrer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

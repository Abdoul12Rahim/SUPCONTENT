import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Badge,
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
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon, DeleteIcon, ChevronDownIcon, ArrowBackIcon, SettingsIcon, EditIcon, LinkIcon, CopyIcon, RepeatIcon, AddIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collaborativeListAPI, contentAPI, socialAPI } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
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

interface ListMember {
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  role: 'owner' | 'editor' | 'viewer';
  addedAt: string;
}

interface ListItem {
  _id: string;
  content: Game;
  addedBy: {
    _id: string;
    username: string;
    displayName?: string;
  };
  addedAt: string;
  note?: string;
}

interface CollaborativeList {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  members: ListMember[];
  items: ListItem[];
  visibility: 'public' | 'private';
  inviteCode: string;
  tags: string[];
  userRole?: string;
}

export const CollaborativeListDetail = () => {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [list, setList] = useState<CollaborativeList | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<ListItem | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteListOpen, onOpen: onDeleteListOpen, onClose: onDeleteListClose } = useDisclosure();
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { isOpen: isMembersOpen, onOpen: onMembersOpen, onClose: onMembersClose } = useDisclosure();
  const { isOpen: isDeleteMemberOpen, onOpen: onDeleteMemberOpen, onClose: onDeleteMemberClose } = useDisclosure();
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'private'>('private');
  const [editTags, setEditTags] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<ListMember | null>(null);
  const cancelRef = useRef(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const userSearchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (listId) {
      fetchList();
    }
  }, [listId]);

  useEffect(() => {
    // Fermer les résultats si on clique en dehors
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
      const response = await collaborativeListAPI.getList(listId!);
      setList(response.data);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste',
        status: 'error',
        duration: 5000,
      });
      navigate('/collaborative-lists');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Annuler le timeout précédent
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Attendre 300ms avant de lancer la recherche
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
    if (!canEdit()) {
      toast({
        title: 'Permission refusée',
        description: 'Vous devez être éditeur ou propriétaire pour ajouter des jeux',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      await collaborativeListAPI.addItem(listId!, {
        contentId: game.externalId.toString(),
      });

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

  const handleRemoveGameConfirm = (item: ListItem) => {
    setItemToRemove(item);
    onDeleteOpen();
  };

  const handleRemoveGame = async () => {
    if (!itemToRemove) return;

    try {
      await collaborativeListAPI.removeItem(listId!, itemToRemove._id);
      
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

  const canEdit = () => {
    return list?.userRole === 'owner' || list?.userRole === 'editor';
  };

  const isOwner = () => {
    return list?.userRole === 'owner';
  };

  const handleOpenEditModal = () => {
    if (!list) return;
    setEditName(list.name);
    setEditDescription(list.description || '');
    setEditVisibility(list.visibility);
    setEditTags(list.tags.join(', '));
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
      const tags = editTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await collaborativeListAPI.updateList(listId!, {
        name: editName,
        description: editDescription,
        visibility: editVisibility,
        tags,
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
      await collaborativeListAPI.deleteList(listId!);

      toast({
        title: 'Liste supprimée',
        description: 'La liste a été supprimée avec succès',
        status: 'success',
        duration: 3000,
      });

      navigate('/collaborative-lists');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer la liste',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleShareOpen = () => {
    if (list?.inviteCode) {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/collaborative-lists/join/${list.inviteCode}`;
      setInviteLink(link);
      onShareOpen();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: 'Lien copié',
        description: 'Le lien d\'invitation a été copié dans le presse-papier',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleRegenerateCode = async () => {
    try {
      await collaborativeListAPI.regenerateInviteCode(listId!);
      await fetchList();
      
      toast({
        title: 'Code régénéré',
        description: 'Un nouveau code d\'invitation a été généré',
        status: 'success',
        duration: 3000,
      });

      // Mettre à jour le lien
      const response = await collaborativeListAPI.getList(listId!);
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/collaborative-lists/join/${response.data.inviteCode}`;
      setInviteLink(link);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de régénérer le code',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleUserSearchChange = async (value: string) => {
    setUserSearchQuery(value);
    
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    if (value.length < 2) {
      setUserSearchResults([]);
      return;
    }

    userSearchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const response = await socialAPI.searchUsers(value);
        setUserSearchResults(response.data || []);
      } catch (error) {
        console.error('Erreur recherche utilisateurs:', error);
        setUserSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
  };

  const handleAddMember = async (userId: string, role: 'editor' | 'viewer') => {
    try {
      await collaborativeListAPI.addMember(listId!, { userId, role });
      
      toast({
        title: 'Membre ajouté',
        description: 'L\'utilisateur a été ajouté à la liste',
        status: 'success',
        duration: 3000,
      });

      setUserSearchQuery('');
      setUserSearchResults([]);
      await fetchList();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible d\'ajouter le membre',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleChangeMemberRole = async (userId: string, newRole: 'editor' | 'viewer') => {
    try {
      await collaborativeListAPI.updateMemberRole(listId!, userId, newRole);
      
      toast({
        title: 'Rôle modifié',
        description: 'Le rôle du membre a été modifié',
        status: 'success',
        duration: 3000,
      });

      await fetchList();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de modifier le rôle',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleRemoveMemberConfirm = (member: ListMember) => {
    setMemberToRemove(member);
    onDeleteMemberOpen();
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await collaborativeListAPI.removeMember(listId!, memberToRemove.user._id);
      
      toast({
        title: 'Membre retiré',
        description: 'L\'utilisateur a été retiré de la liste',
        status: 'success',
        duration: 3000,
      });

      setMemberToRemove(null);
      onDeleteMemberClose();
      await fetchList();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de retirer le membre',
        status: 'error',
        duration: 3000,
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
            onClick={() => navigate('/collaborative-lists')}
            mb={4}
          >
            Retour aux listes
          </Button>

          <HStack justify="space-between" mb={2}>
            <HStack spacing={3}>
              <Heading size="lg">{list.name}</Heading>
              <Badge colorScheme={list.visibility === 'public' ? 'green' : 'gray'}>
                {list.visibility === 'public' ? '👁️ Publique' : '🔒 Privée'}
              </Badge>
              <Badge colorScheme={
                list.userRole === 'owner' ? 'purple' :
                list.userRole === 'editor' ? 'blue' : 'gray'
              }>
                {list.userRole === 'owner' ? 'Propriétaire' :
                 list.userRole === 'editor' ? 'Éditeur' : 'Lecteur'}
              </Badge>
            </HStack>
            {isOwner() && (
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<SettingsIcon />}
                  variant="ghost"
                  aria-label="Options"
                />
                <MenuList>
                  <MenuItem icon={<LinkIcon />} onClick={handleShareOpen}>
                    Partager la liste
                  </MenuItem>
                  <MenuItem icon={<AddIcon />} onClick={onMembersOpen}>
                    Gérer les membres
                  </MenuItem>
                  <MenuItem icon={<EditIcon />} onClick={handleOpenEditModal}>
                    Modifier la liste
                  </MenuItem>
                  <MenuItem icon={<DeleteIcon />} color="red.500" onClick={onDeleteListOpen}>
                    Supprimer la liste
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </HStack>

          {list.description && (
            <Text color="gray.600" mb={4}>{list.description}</Text>
          )}

          {list.tags.length > 0 && (
            <HStack spacing={2} mb={4}>
              {list.tags.map((tag, index) => (
                <Badge key={index} colorScheme="blue">{tag}</Badge>
              ))}
            </HStack>
          )}

          <Text fontSize="sm" color="gray.500">
            {list.items.length} jeu{list.items.length !== 1 ? 'x' : ''} • {list.members.length} membre{list.members.length !== 1 ? 's' : ''}
          </Text>
        </Box>

        {/* Recherche de jeux */}
        {canEdit() && (
          <Box bg={useColorModeValue('white', 'gray.800')} p={4} borderRadius="lg" shadow="sm" className="search-container" position="relative">
            <Heading size="md" mb={3}>➕ Ajouter un jeu</Heading>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                {searching ? <Spinner size="sm" /> : <SearchIcon color="gray.400" />}
              </InputLeftElement>
              <Input
                placeholder="Rechercher un jeu par son nom..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
            </InputGroup>

            {/* Résultats de recherche */}
            {showResults && searchResults.length > 0 && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                mt={2}
                bg={useColorModeValue('white', 'gray.800')}
                borderRadius="md"
                shadow="lg"
                zIndex={10}
                maxH="400px"
                overflowY="auto"
              >
                {searchResults.map((game) => (
                  <Box
                    key={game.externalId}
                    p={3}
                    cursor="pointer"
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => handleAddGame(game)}
                    borderBottomWidth="1px"
                  >
                    <HStack spacing={3}>
                      {game.backgroundImage && (
                        <Box
                          w="60px"
                          h="40px"
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
                        <Text fontWeight="medium">{game.title}</Text>
                        {game.genres && game.genres.length > 0 && (
                          <Text fontSize="sm" color="gray.500">
                            {game.genres.slice(0, 3).join(', ')}
                          </Text>
                        )}
                      </VStack>
                      {game.rating && (
                        <Text fontSize="sm" color="yellow.500" fontWeight="bold">
                          ⭐ {game.rating.toFixed(1)}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                ))}
              </Box>
            )}

            {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !searching && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                mt={2}
                bg={useColorModeValue('white', 'gray.800')}
                borderRadius="md"
                shadow="lg"
                p={4}
                textAlign="center"
              >
                <Text color="gray.500">Aucun jeu trouvé</Text>
              </Box>
            )}
          </Box>
        )}

        {/* Liste des jeux */}
        <Box bg={useColorModeValue('white', 'gray.800')} p={4} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>🎮 Jeux de la liste</Heading>
          
          {list.items.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="4xl" mb={2}>🎮</Text>
              <Text color="gray.500">Aucun jeu dans cette liste</Text>
              {canEdit() && (
                <Text fontSize="sm" color="gray.400" mt={2}>
                  Utilisez la recherche ci-dessus pour ajouter des jeux
                </Text>
              )}
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {list.items.map((item) => (
                <Box
                  key={item._id}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  _hover={{ shadow: 'md' }}
                  transition="all 0.2s"
                  position="relative"
                  role="group"
                >
                  {item.content.backgroundImage && (
                    <Box
                      h="150px"
                      overflow="hidden"
                      cursor="pointer"
                      onClick={() => navigate(`/game/${item.content.slug}`)}
                    >
                      <img
                        src={item.content.backgroundImage}
                        alt={item.content.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  )}
                  
                  {canEdit() && (
                    <IconButton
                      icon={<DeleteIcon />}
                      aria-label="Retirer"
                      size="sm"
                      colorScheme="red"
                      position="absolute"
                      top={2}
                      right={2}
                      opacity={0}
                      _groupHover={{ opacity: 1 }}
                      onClick={() => handleRemoveGameConfirm(item)}
                    />
                  )}

                  <Box p={3}>
                    <Text
                      fontWeight="bold"
                      mb={1}
                      cursor="pointer"
                      _hover={{ color: 'blue.500' }}
                      onClick={() => navigate(`/game/${item.content.slug}`)}
                    >
                      {item.content.title}
                    </Text>
                    
                    {item.note && (
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        💭 {item.note}
                      </Text>
                    )}
                    
                    <Text fontSize="xs" color="gray.500">
                      Ajouté par {item.addedBy.displayName || item.addedBy.username}
                    </Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Membres */}
        <Box bg={useColorModeValue('white', 'gray.800')} p={4} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>👥 Membres ({list.members.length})</Heading>
          <VStack spacing={3} align="stretch">
            {list.members.map((member) => (
              <HStack key={member.user._id} spacing={3}>
                <Avatar
                  size="sm"
                  name={member.user.displayName || member.user.username}
                  src={getAvatarUrl(member.user.avatar)}
                  cursor="pointer"
                  onClick={() => navigate(`/profile/${member.user._id}`)}
                />
                <VStack align="start" spacing={0} flex={1}>
                  <Text
                    fontWeight="medium"
                    cursor="pointer"
                    _hover={{ color: 'blue.500' }}
                    onClick={() => navigate(`/profile/${member.user._id}`)}
                  >
                    {member.user.displayName || member.user.username}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    @{member.user.username}
                  </Text>
                </VStack>
                <Badge colorScheme={
                  member.role === 'owner' ? 'purple' :
                  member.role === 'editor' ? 'blue' : 'gray'
                }>
                  {member.role === 'owner' ? 'Propriétaire' :
                   member.role === 'editor' ? 'Éditeur' : 'Lecteur'}
                </Badge>
              </HStack>
            ))}
          </VStack>
        </Box>
      </VStack>

      {/* Dialog de confirmation de suppression d'item */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Retirer le jeu</AlertDialogHeader>
            <AlertDialogBody>
              Êtes-vous sûr de vouloir retirer "{itemToRemove?.content.title}" de la liste ?
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
              Cette action est irréversible et tous les jeux et membres seront perdus.
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

      {/* Dialog de confirmation de suppression de membre */}
      <AlertDialog
        isOpen={isDeleteMemberOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteMemberClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Retirer le membre</AlertDialogHeader>
            <AlertDialogBody>
              Êtes-vous sûr de vouloir retirer "{memberToRemove?.user.displayName || memberToRemove?.user.username}" de la liste ?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteMemberClose}>
                Annuler
              </Button>
              <Button colorScheme="red" onClick={handleRemoveMember} ml={3}>
                Retirer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Modal de partage */}
      <Modal isOpen={isShareOpen} onClose={onShareClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Partager la liste</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Partagez ce lien avec d'autres utilisateurs pour qu'ils puissent rejoindre votre liste.
                {list?.visibility === 'private' && ' (Seuls les personnes avec ce lien peuvent rejoindre)'}
              </Text>

              <FormControl>
                <FormLabel>Lien d'invitation</FormLabel>
                <InputGroup>
                  <Input
                    value={inviteLink}
                    isReadOnly
                    pr="4.5rem"
                    bg={useColorModeValue('gray.50', 'gray.600')}
                  />
                </InputGroup>
              </FormControl>

              <HStack spacing={3}>
                <Button
                  leftIcon={<CopyIcon />}
                  onClick={handleCopyLink}
                  colorScheme="blue"
                  flex={1}
                >
                  Copier le lien
                </Button>
                <Button
                  leftIcon={<RepeatIcon />}
                  onClick={handleRegenerateCode}
                  variant="outline"
                  flex={1}
                >
                  Régénérer
                </Button>
              </HStack>

              <Box p={3} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                <Text fontSize="xs" color="gray.700">
                  <strong>Note :</strong> Si vous régénérez le code, l'ancien lien ne fonctionnera plus.
                  Les membres actuels resteront dans la liste.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onShareClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
                  placeholder="Ma liste collaborative"
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

              <FormControl isRequired>
                <FormLabel>Visibilité</FormLabel>
                <Select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value as 'public' | 'private')}
                >
                  <option value="private">🔒 Privée</option>
                  <option value="public">👁️ Publique</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Tags (séparés par des virgules)</FormLabel>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="RPG, Action, Aventure"
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

      {/* Modal de gestion des membres */}
      <Modal isOpen={isMembersOpen} onClose={onMembersClose} size="xl">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>Gérer les membres</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <VStack spacing={6} align="stretch">
              {/* Section Ajouter un membre */}
              <Box>
                <Heading size="sm" mb={3}>Ajouter un membre</Heading>
                <FormControl>
                  <FormLabel>Rechercher un utilisateur</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                      value={userSearchQuery}
                      onChange={(e) => handleUserSearchChange(e.target.value)}
                      placeholder="Tapez un nom d'utilisateur..."
                    />
                  </InputGroup>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Recherchez un utilisateur par son nom ou pseudo (minimum 2 caractères)
                  </Text>
                </FormControl>

                {searchingUsers && (
                  <HStack justify="center" py={4}>
                    <Spinner size="sm" />
                    <Text fontSize="sm">Recherche...</Text>
                  </HStack>
                )}

                {!searchingUsers && userSearchResults.length > 0 && (() => {
                  const availableUsers = userSearchResults.filter(u => !list?.members.some(m => m.user._id === u._id));
                  
                  if (availableUsers.length === 0) {
                    return (
                      <Box p={3} bg="gray.50" borderRadius="md" mt={3}>
                        <Text fontSize="sm" color="gray.600">
                          Tous les utilisateurs trouvés sont déjà membres de la liste
                        </Text>
                      </Box>
                    );
                  }

                  return (
                    <VStack align="stretch" spacing={2} mt={3} maxH="200px" overflowY="auto" borderWidth="1px" borderRadius="md" p={2}>
                      {availableUsers.map((user) => (
                        <HStack key={user._id} justify="space-between" p={2} _hover={{ bg: 'gray.50' }} borderRadius="md">
                          <HStack>
                            <Avatar size="sm" name={user.username} src={user.avatar} />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">{user.displayName || user.username}</Text>
                              <Text fontSize="xs" color="gray.500">@{user.username}</Text>
                            </VStack>
                          </HStack>
                          <HStack>
                            <Button size="xs" colorScheme="blue" onClick={() => handleAddMember(user._id, 'editor')}>
                              Éditeur
                            </Button>
                            <Button size="xs" variant="outline" onClick={() => handleAddMember(user._id, 'viewer')}>
                              Lecteur
                            </Button>
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  );
                })()}

                {!searchingUsers && userSearchQuery.length >= 2 && userSearchResults.length === 0 && (
                  <Box p={3} bg="yellow.50" borderRadius="md" mt={3}>
                    <Text fontSize="sm" color="gray.700">
                      Aucun utilisateur trouvé pour "{userSearchQuery}"
                    </Text>
                  </Box>
                )}

                {!searchingUsers && userSearchQuery.length > 0 && userSearchQuery.length < 2 && (
                  <Box p={3} bg="blue.50" borderRadius="md" mt={3}>
                    <Text fontSize="sm" color="blue.700">
                      Tapez au moins 2 caractères pour lancer la recherche
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Section Liste des membres */}
              <Box>
                <Heading size="sm" mb={3}>Membres actuels ({list?.members.length})</Heading>
                <VStack align="stretch" spacing={3}>
                  {list?.members.map((member) => (
                    <HStack key={member.user._id} justify="space-between" p={3} borderWidth="1px" borderRadius="md">
                      <HStack flex={1}>
                        <Avatar 
                          size="sm" 
                          name={member.user.displayName || member.user.username} 
                          src={member.user.avatar}
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            {member.user.displayName || member.user.username}
                          </Text>
                          <Text fontSize="xs" color="gray.500">@{member.user.username}</Text>
                        </VStack>
                      </HStack>

                      {member.role === 'owner' ? (
                        <Badge colorScheme="purple">Propriétaire</Badge>
                      ) : (
                        <HStack>
                          <Select
                            size="sm"
                            value={member.role}
                            onChange={(e) => handleChangeMemberRole(member.user._id, e.target.value as 'editor' | 'viewer')}
                            width="120px"
                          >
                            <option value="editor">Éditeur</option>
                            <option value="viewer">Lecteur</option>
                          </Select>
                          <IconButton
                            aria-label="Retirer"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleRemoveMemberConfirm(member)}
                          />
                        </HStack>
                      )}
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onMembersClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

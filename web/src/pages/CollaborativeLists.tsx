import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Grid,
  Badge,
  Avatar,
  AvatarGroup,
  useDisclosure,
  useToast,
  Spinner,
  Flex,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
} from '@chakra-ui/react';
import { AddIcon, LockIcon, ViewIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collaborativeListAPI } from '../services/api';
import CreateListModal from '../components/CollaborativeLists/CreateListModal';


interface CollaborativeList {
  _id: string;
  name: string;
  description?: string;
  owner: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  members: Array<{
    user: {
      _id: string;
      username: string;
      displayName?: string;
      avatar?: string;
    };
    role: string;
  }>;
  items: any[];
  visibility: 'public' | 'private';
  tags: string[];
  userRole?: string;
  createdAt: string;
  updatedAt: string;
}

export const CollaborativeListsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [myLists, setMyLists] = useState<CollaborativeList[]>([]);
  const [publicLists, setPublicLists] = useState<CollaborativeList[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningListId, setJoiningListId] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyLists();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (tabIndex === 1) {
      fetchPublicLists();
    }
  }, [tabIndex]);

  const fetchMyLists = async () => {
    try {
      setLoading(true);
      const response = await collaborativeListAPI.getMyLists();
      setMyLists(response.data.lists);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les listes',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicLists = async () => {
    try {
      setLoading(true);
      const response = await collaborativeListAPI.getPublicLists();
      setPublicLists(response.data.lists);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les listes publiques',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (data: {
    name: string;
    description?: string;
    visibility?: 'public' | 'private';
    tags?: string[];
  }) => {
    try {
      await collaborativeListAPI.create(data);
      toast({
        title: 'Liste créée',
        description: 'Votre liste collaborative a été créée avec succès',
        status: 'success',
        duration: 3000,
      });
      onClose();
      fetchMyLists();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de créer la liste',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleJoinList = async (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setJoiningListId(listId);
      await collaborativeListAPI.joinListPublic(listId);
      
      toast({
        title: 'Succès',
        description: 'Vous avez rejoint la liste',
        status: 'success',
        duration: 3000,
      });
      
      // Recharger les listes
      fetchPublicLists();
      fetchMyLists();
      
      // Rediriger vers la liste
      setTimeout(() => {
        navigate(`/collaborative-lists/${listId}`);
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de rejoindre la liste',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setJoiningListId(null);
    }
  };

  const isUserMember = (list: CollaborativeList): boolean => {
    if (!user) return false;
    return list.members.some(m => m.user._id === user._id);
  };

  const ListCard = ({ list, showJoinButton = false }: { list: CollaborativeList; showJoinButton?: boolean }) => {
    const isMember = isUserMember(list);
    const isJoining = joiningListId === list._id;

    return (
      <Box
        p={6}
        bg={useColorModeValue('white', 'gray.800')}
        borderRadius="lg"
        shadow="md"
        cursor="pointer"
        _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
        transition="all 0.2s"
        onClick={() => navigate(`/collaborative-lists/${list._id}`)}
      >
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <Heading size="md" noOfLines={1}>
              {list.name}
            </Heading>
            <HStack>
              {list.visibility === 'private' ? (
                <Icon as={LockIcon} color="gray.500" boxSize={4} />
              ) : (
                <Icon as={ViewIcon} color="blue.500" boxSize={4} />
              )}
              {list.userRole && (
                <Badge colorScheme={list.userRole === 'owner' ? 'purple' : list.userRole === 'editor' ? 'blue' : 'gray'}>
                  {list.userRole === 'owner' ? 'Propriétaire' : list.userRole === 'editor' ? 'Éditeur' : 'Lecteur'}
                </Badge>
              )}
            </HStack>
          </HStack>

          {list.description && (
            <Text fontSize="sm" color="gray.600" noOfLines={2}>
              {list.description}
            </Text>
          )}

          <HStack spacing={4}>
            <HStack>
              <Text fontSize="sm" fontWeight="semibold">
                {list.items?.length || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {list.items?.length === 1 ? 'jeu' : 'jeux'}
              </Text>
            </HStack>

            <AvatarGroup size="sm" max={3}>
              {list.members?.map((member) => (
                <Avatar
                  key={member.user._id}
                  name={member.user.displayName || member.user.username}
                  src={member.user.avatar}
                />
              ))}
            </AvatarGroup>
          </HStack>

          {list.tags && list.tags.length > 0 && (
            <HStack spacing={2} flexWrap="wrap">
              {list.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} colorScheme="teal" fontSize="xs">
                  {tag}
                </Badge>
              ))}
            </HStack>
          )}

          {showJoinButton && !isMember && (
            <Button
              colorScheme="blue"
              size="sm"
              onClick={(e) => handleJoinList(list._id, e)}
              isLoading={isJoining}
              loadingText="Rejoindre..."
              leftIcon={<AddIcon />}
              width="full"
            >
              Rejoindre
            </Button>
          )}
        </VStack>
      </Box>
    );
  };

  if (!isAuthenticated) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Heading>Listes Collaboratives</Heading>
          <Text>Connectez-vous pour créer et gérer des listes collaboratives</Text>
          <Button colorScheme="blue" onClick={() => navigate('/login')}>
            Se connecter
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Heading>👥 Listes Partagées</Heading>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
              Nouvelle liste
            </Button>
          </HStack>
          <Text color="gray.600" fontSize="sm">
            Créez des listes collaboratives et invitez d'autres utilisateurs. Pour organiser votre collection personnelle, utilisez "Ma Collection".
          </Text>
        </VStack>

        <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="blue">
          <TabList>
            <Tab>Mes Listes</Tab>
            <Tab>Listes Publiques</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="blue.500" />
                </Flex>
              ) : myLists.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text color="gray.500" mb={4}>
                    Vous n'avez pas encore de listes collaboratives
                  </Text>
                  <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
                    Créer ma première liste
                  </Button>
                </Box>
              ) : (
                <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                  gap={6}
                  mt={4}
                >
                  {myLists.map((list) => (
                    <ListCard key={list._id} list={list} />
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel px={0}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="blue.500" />
                </Flex>
              ) : publicLists.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text color="gray.500">Aucune liste publique pour le moment</Text>
                </Box>
              ) : (
                <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                  gap={6}
                  mt={4}
                >
                  {publicLists.map((list) => (
                    <ListCard key={list._id} list={list} showJoinButton={true} />
                  ))}
                </Grid>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      <CreateListModal isOpen={isOpen} onClose={onClose} onCreate={handleCreateList} />
    </Container>
  );
};

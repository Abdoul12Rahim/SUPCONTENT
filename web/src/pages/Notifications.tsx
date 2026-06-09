import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  ButtonGroup,
  Avatar,
  Badge,
  Flex,
  Spinner,
  useToast,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from '@chakra-ui/react';
import { BellIcon, DeleteIcon, CheckIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

interface Notification {
  _id: string;
  type: 'follow' | 'like' | 'comment' | 'recommendation';
  from: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  message: string;
  isRead: boolean;
  createdAt: string;
  reference?: string;
}

type FilterType = 'all' | 'follow' | 'like' | 'comment' | 'recommendation';

export const Notifications = () => {
  const { isAuthenticated } = useAuth();
  const { unreadCount, decrementCount, refetch } = useUnreadNotifications();
  const navigate = useNavigate();
  const toast = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');
  const cardBg = useColorModeValue('white', 'gray.800');
  const readBg = useColorModeValue('white', 'gray.800');
  const unreadBg = useColorModeValue('blue.50', 'blue.900');
  const hoverReadBg = useColorModeValue('gray.50', 'gray.700');
  const hoverUnreadBg = useColorModeValue('blue.100', 'blue.800');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const dividerBg = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, page, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = { page };
      if (filter !== 'all') {
        params.type = filter;
      }

      const response = await api.get('/notifications', { params });
      setNotifications(response.data.notifications || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les notifications',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      decrementCount(1);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer comme lue',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/unread`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: false } : n))
      );
      await refetch();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer comme non lue',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refetch();
      toast({
        title: 'Succès',
        description: 'Toutes les notifications marquées comme lues',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer toutes comme lues',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      toast({
        title: 'Notification supprimée',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lue si non lue
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigation selon le type
    if (notification.type === 'follow') {
      navigate(`/profile/${notification.from._id}`);
    } else if (notification.type === 'like' || notification.type === 'comment') {
      if (notification.reference) {
        navigate(`/review/${notification.reference}`);
      }
    }
  };

  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); // Empêcher le clic parent
    navigate(`/profile/${userId}`);
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      follow: '👤',
      like: '❤️',
      comment: '💬',
      recommendation: '🎮',
    };
    return icons[type] || '🔔';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const filterButtons = [
    { label: 'Tout', value: 'all', icon: '🔔' },
    { label: 'Abonnements', value: 'follow', icon: '👤' },
    { label: 'Likes', value: 'like', icon: '❤️' },
    { label: 'Commentaires', value: 'comment', icon: '💬' },
    { label: 'Recommandations', value: 'recommendation', icon: '🎮' },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <BellIcon boxSize={6} color="blue.500" />
            <Heading size="lg">Notifications</Heading>
            {unreadCount > 0 && (
              <Badge colorScheme="red" fontSize="md" borderRadius="full" px={3} py={1}>
                {unreadCount}
              </Badge>
            )}
          </HStack>
          {unreadCount > 0 && (
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={handleMarkAllAsRead}
              leftIcon={<CheckIcon />}
            >
              Tout marquer comme lu
            </Button>
          )}
        </Flex>

        {/* Filtres */}
        <ButtonGroup spacing={2} flexWrap="wrap">
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              size="sm"
              variant={filter === btn.value ? 'solid' : 'outline'}
              colorScheme={filter === btn.value ? 'blue' : 'gray'}
              onClick={() => {
                setFilter(btn.value as FilterType);
                setPage(1);
              }}
            >
              {btn.icon} {btn.label}
            </Button>
          ))}
        </ButtonGroup>

        {/* Liste des notifications */}
        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="lg" color="blue.500" />
          </Flex>
        ) : notifications.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Text color={mutedText} fontSize="lg">
              Aucune notification {filter !== 'all' && `de type ${filter}`}
            </Text>
          </Box>
        ) : (
          <VStack spacing={0} align="stretch" bg={cardBg} borderRadius="lg" overflow="hidden">
            {notifications.map((notification, index) => (
              <Box key={notification._id}>
                <Flex
                  p={4}
                  bg={notification.isRead ? readBg : unreadBg}
                  _hover={{ bg: notification.isRead ? hoverReadBg : hoverUnreadBg }}
                  cursor="pointer"
                  transition="all 0.2s"
                  onClick={() => handleNotificationClick(notification)}
                  role="group"
                >
                  <Avatar
                    size="md"
                    name={notification.from.displayName || notification.from.username}
                    src={getAvatarUrl(notification.from.avatar)}
                    mr={3}
                    cursor="pointer"
                    onClick={(e) => handleUserClick(e, notification.from._id)}
                    _hover={{ opacity: 0.8 }}
                  />
                  <Box flex={1}>
                    <HStack spacing={2} mb={1}>
                      <Text fontSize="xl">{getNotificationIcon(notification.type)}</Text>
                      <Text 
                        fontWeight={notification.isRead ? 'normal' : 'bold'}
                        color="blue.600"
                        cursor="pointer"
                        _hover={{ textDecoration: 'underline' }}
                        onClick={(e) => handleUserClick(e, notification.from._id)}
                      >
                        {notification.from.displayName || notification.from.username}
                      </Text>
                      <Text color={mutedText}>{notification.message}</Text>
                    </HStack>
                    <Text fontSize="sm" color={mutedText}>
                      {formatTime(notification.createdAt)}
                    </Text>
                  </Box>

                  {/* Actions */}
                  <HStack spacing={1} opacity={0} _groupHover={{ opacity: 1 }} transition="opacity 0.2s">
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<ChevronDownIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MenuList>
                        {notification.isRead ? (
                          <MenuItem onClick={(e) => { e.stopPropagation(); handleMarkAsUnread(notification._id); }}>
                            Marquer comme non lue
                          </MenuItem>
                        ) : (
                          <MenuItem onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification._id); }}>
                            Marquer comme lue
                          </MenuItem>
                        )}
                        <MenuItem
                          onClick={(e) => { e.stopPropagation(); handleDelete(notification._id); }}
                          color="red.500"
                        >
                          Supprimer
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </Flex>
                {index < notifications.length - 1 && <Box h="1px" bg={dividerBg} />}
              </Box>
            ))}
          </VStack>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="center" gap={2}>
            <Button
              size="sm"
              isDisabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Précédent
            </Button>
            <Text alignSelf="center" px={4}>
              Page {page} sur {totalPages}
            </Text>
            <Button
              size="sm"
              isDisabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Suivant
            </Button>
          </Flex>
        )}
      </VStack>
    </Container>
  );
};

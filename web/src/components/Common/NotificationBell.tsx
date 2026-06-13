import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Text,
  VStack,
  HStack,
  Avatar,
  Divider,
  Button,
  Spinner,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { getAvatarUrl } from '../../utils/avatar';

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

export const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const { unreadCount, decrementCount } = useUnreadNotifications();
  const navigate = useNavigate();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuBorder = useColorModeValue('gray.200', 'gray.700');
  const headerText = useColorModeValue('gray.800', 'whiteAlpha.900');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const unreadBg = useColorModeValue('blue.50', 'blue.900');
  const unreadHoverBg = useColorModeValue('blue.100', 'blue.800');
  const readBg = useColorModeValue('white', 'gray.800');
  const readHoverBg = useColorModeValue('gray.50', 'gray.700');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');
  const avatarNameColor = useColorModeValue('blue.600', 'blue.300');
  const messageTextColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications();
    }
  }, [isOpen, isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll();
      setNotifications(response.data.notifications || []);
    } catch (error: any) {
      console.error('Erreur:', error);
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

  const handleMenuOpen = () => {
    setIsOpen(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      decrementCount(1);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      decrementCount(unreadCount);
      toast({
        title: 'Succès',
        description: 'Toutes les notifications ont été marquées comme lues',
        status: 'success',
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer les notifications comme lues',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lu
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    // Naviguer selon le type
    switch (notification.type) {
      case 'follow':
        navigate(`/profile/${notification.from._id}`);
        break;
      case 'like':
      case 'comment':
        // Naviguer vers la critique si référence existe
        if (notification.reference) {
          navigate(`/review/${notification.reference}`);
        }
        break;
      default:
        break;
    }
  };

  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); // Empêcher le clic parent
    navigate(`/profile/${userId}`);
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return '👤';
      case 'like':
        return '⭐';
      case 'comment':
        return '💬';
      case 'recommendation':
        return '🎮';
      default:
        return '🔔';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Menu onOpen={handleMenuOpen} onClose={() => setIsOpen(false)}>
      <MenuButton
        as={IconButton}
        icon={
          <Box position="relative">
            <BellIcon boxSize={5} />
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="-8px"
                right="-8px"
                colorScheme="red"
                borderRadius="full"
                fontSize="xs"
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Box>
        }
        variant="ghost"
        color="ui.text"
        _hover={{ bg: 'rgba(124,58,237,0.15)' }}
        aria-label="Notifications"
      />
      <MenuList maxH="500px" overflowY="auto" w="400px" p={0} bg={menuBg} borderColor={menuBorder}>
        <Box p={4} borderBottomWidth="1px" borderColor={dividerColor}>
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="lg" color={headerText}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" onClick={handleMarkAllAsRead} color={headerText}>
                Tout marquer comme lu
              </Button>
            )}
          </HStack>
        </Box>

        {loading ? (
          <Box py={8} textAlign="center">
            <Spinner size="lg" color="brand.500" />
          </Box>
        ) : notifications.length === 0 ? (
          <Box py={8} textAlign="center">
            <Text fontSize="4xl" mb={2}>
              🔔
            </Text>
            <Text color={mutedText}>Aucune notification</Text>
          </Box>
        ) : (
          <VStack spacing={0} align="stretch">
            {notifications.map((notification, index) => (
              <Box key={notification._id}>
                <MenuItem
                  py={3}
                  px={4}
                  bg={notification.isRead ? readBg : unreadBg}
                  _hover={{ bg: notification.isRead ? readHoverBg : unreadHoverBg }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <HStack spacing={3} align="start" w="full">
                    <Avatar
                      size="sm"
                      name={notification.from.displayName || notification.from.username}
                      src={getAvatarUrl(notification.from.avatar)}
                      cursor="pointer"
                      onClick={(e) => handleUserClick(e, notification.from._id)}
                      _hover={{ opacity: 0.8 }}
                    />
                    <VStack align="start" spacing={0} flex={1}>
                      <HStack spacing={1}>
                        <Text 
                          fontSize="sm" 
                          fontWeight={notification.isRead ? 'normal' : 'bold'}
                          color={avatarNameColor}
                          cursor="pointer"
                          _hover={{ textDecoration: 'underline' }}
                          onClick={(e) => handleUserClick(e, notification.from._id)}
                        >
                          {notification.from.displayName || notification.from.username}
                        </Text>
                        <Text fontSize="sm" color={messageTextColor}>
                          {notification.message}
                        </Text>
                        <Text fontSize="lg">{getNotificationIcon(notification.type)}</Text>
                      </HStack>
                      <Text fontSize="xs" color={mutedText}>
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                    </VStack>
                    {!notification.isRead && (
                      <Box w="8px" h="8px" borderRadius="full" bg="brand.500" />
                    )}
                  </HStack>
                </MenuItem>
                {index < notifications.length - 1 && <Divider borderColor={dividerColor} />}
              </Box>
            ))}
          </VStack>
        )}

        {/* Bouton Voir toutes */}
        {notifications.length > 0 && (
          <>
            <Divider borderColor={dividerColor} />
            <Box p={3}>
              <Button
                w="full"
                size="sm"
                colorScheme="purple"
                variant="ghost"
                onClick={() => navigate('/notifications')}
                color={headerText}
              >
                Voir toutes les notifications
              </Button>
            </Box>
          </>
        )}
      </MenuList>
    </Menu>
  );
};

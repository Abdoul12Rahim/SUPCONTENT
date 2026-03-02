import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Avatar,
  Text,
  Button,
  Divider,
  Spinner,
  Box,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socialAPI } from '../../services/socialService';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl } from '../../utils/avatar';

interface User {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  title: string;
}

export const UserListModal = ({ isOpen, onClose, userId, type, title }: UserListModalProps) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = type === 'followers' 
        ? await socialAPI.getFollowers(userId)
        : await socialAPI.getFollowing(userId);
      
      const userList = response.data[type] || [];
      setUsers(userList);

      // Vérifier le statut de follow pour chaque utilisateur
      if (currentUser) {
        const statuses = await Promise.all(
          userList.map(async (user: User) => {
            try {
              const res = await socialAPI.checkFollowStatus(user._id);
              return { userId: user._id, isFollowing: res.data.isFollowing };
            } catch {
              return { userId: user._id, isFollowing: false };
            }
          })
        );
        const following = new Set(statuses.filter(s => s.isFollowing).map(s => s.userId));
        setFollowingUsers(following);
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      setActionLoading(targetUserId);
      const isFollowing = followingUsers.has(targetUserId);
      
      if (isFollowing) {
        await socialAPI.unfollowUser(targetUserId);
        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });
      } else {
        await socialAPI.followUser(targetUserId);
        setFollowingUsers((prev) => new Set(prev).add(targetUserId));
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserClick = (targetUserId: string) => {
    navigate(`/profile/${targetUserId}`);
    onClose();
  };

  const getFollowButtonText = (targetUserId: string) => {
    if (currentUser?._id === targetUserId) return null;
    return followingUsers.has(targetUserId) ? 'Abonné' : 'S\'abonner';
  };

  const getFollowButtonProps = (targetUserId: string) => {
    const isFollowing = followingUsers.has(targetUserId);
    return {
      size: 'sm' as const,
      colorScheme: isFollowing ? 'gray' : 'blue',
      variant: isFollowing ? 'outline' as const : 'solid' as const,
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader borderBottomWidth="1px">{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0}>
          {loading ? (
            <Box py={8} textAlign="center">
              <Spinner size="lg" color="blue.500" />
            </Box>
          ) : users.length === 0 ? (
            <Box py={8} textAlign="center">
              <Text color="gray.500">Aucun utilisateur</Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch">
              {users.map((user, index) => (
                <Box key={user._id}>
                  <HStack spacing={3} p={4} _hover={{ bg: 'gray.50' }}>
                    <Avatar
                      size="md"
                      name={user.displayName || user.username}
                      src={getAvatarUrl(user.avatar)}
                      cursor="pointer"
                      onClick={() => handleUserClick(user._id)}
                    />
                    <VStack align="start" spacing={0} flex={1} cursor="pointer" onClick={() => handleUserClick(user._id)}>
                      <Text fontWeight="semibold" fontSize="sm">
                        {user.displayName || user.username}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        @{user.username}
                      </Text>
                      {user.bio && (
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {user.bio}
                        </Text>
                      )}
                    </VStack>
                    {currentUser && currentUser._id !== user._id && (
                      <Button
                        {...getFollowButtonProps(user._id)}
                        onClick={() => handleFollow(user._id)}
                        isLoading={actionLoading === user._id}
                      >
                        {getFollowButtonText(user._id)}
                      </Button>
                    )}
                  </HStack>
                  {index < users.length - 1 && <Divider />}
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

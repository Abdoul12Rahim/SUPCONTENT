import {
  Box,
  Flex,
  Button,
  HStack,
  Text,
  Container,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { SearchIcon, BellIcon, SettingsIcon } from '@chakra-ui/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { NotificationBell } from '../Common/NotificationBell';
import { getAvatarUrl } from '../../utils/avatar';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { Badge } from '@chakra-ui/react';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <Box bg="white" px={4} shadow="sm" position="sticky" top={0} zIndex={10} borderBottom="1px" borderColor="gray.100">
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <HStack spacing={8}>
            <Link to="/">
              <HStack spacing={2}>
                <Text fontSize="3xl">🎮</Text>
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  UNIVERS GAME
                </Text>
              </HStack>
            </Link>

            <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
              <Link to="/">
                <Button 
                  variant="ghost"
                  fontWeight={isActive('/') ? 'bold' : 'normal'}
                  color={isActive('/') ? 'gray.900' : 'gray.600'}
                  _hover={{ color: 'gray.900' }}
                >
                  🏠 Accueil
                </Button>
              </Link>
              <Link to="/games">
                <Button 
                  variant="ghost"
                  fontWeight={isActive('/games') ? 'bold' : 'normal'}
                  color={isActive('/games') ? 'gray.900' : 'gray.600'}
                  _hover={{ color: 'gray.900' }}
                  leftIcon={<SearchIcon />}
                >
                  Recherche
                </Button>
              </Link>
            
              {isAuthenticated && (
                <>
                  <Menu>
                    <MenuButton
                      as={Button}
                      variant="ghost"
                      fontWeight={(isActive('/library') || isActive('/reviews') || isActive('/feed')) ? 'bold' : 'normal'}
                      color={(isActive('/library') || isActive('/reviews') || isActive('/feed')) ? 'gray.900' : 'gray.600'}
                      _hover={{ color: 'gray.900' }}
                    >
                      📂 Mon Espace
                    </MenuButton>
                    <MenuList>
                      <Link to="/library">
                        <MenuItem icon={<Text>📚</Text>}>Ma Collection</MenuItem>
                      </Link>
                      <Link to="/collaborative-lists">
                        <MenuItem icon={<Text>👥</Text>}>Listes Partagées</MenuItem>
                      </Link>
                      <Link to="/reviews">
                        <MenuItem icon={<Text>✍️</Text>}>Mes Critiques</MenuItem>
                      </Link>
                      <Link to="/feed">
                        <MenuItem icon={<Text>📰</Text>}>Mon Feed</MenuItem>
                      </Link>
                    </MenuList>
                  </Menu>
                  
                  <Link to="/discover">
                    <Button 
                      variant="ghost"
                      fontWeight={isActive('/discover') ? 'bold' : 'normal'}
                      color={isActive('/discover') ? 'gray.900' : 'gray.600'}
                      _hover={{ color: 'gray.900' }}
                    >
                      🔍 Découvrir
                    </Button>
                  </Link>
                  
                  <Link to="/messages">
                    <Box position="relative">
                      <Button 
                        variant="ghost"
                        fontWeight={isActive('/messages') ? 'bold' : 'normal'}
                        color={isActive('/messages') ? 'gray.900' : 'gray.600'}
                        _hover={{ color: 'gray.900' }}
                      >
                        💬 Messages
                      </Button>
                      {unreadCount > 0 && (
                        <Badge
                          position="absolute"
                          top="-4px"
                          right="-4px"
                          colorScheme="red"
                          borderRadius="full"
                          fontSize="xs"
                          px={unreadCount > 9 ? 1.5 : 2}
                          minW="20px"
                          h="20px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </Box>
                  </Link>
                </>
              )}
            </HStack>
          </HStack>

          <HStack spacing={3}>
            {isAuthenticated ? (
              <>
                <NotificationBell />
                
                <IconButton
                  aria-label="Settings"
                  icon={<SettingsIcon />}
                  variant="ghost"
                  onClick={() => navigate('/settings')}
                />
                
                <Menu>
                  <MenuButton>
                    <HStack spacing={2}>
                      <Avatar
                        size="sm"
                        name={user?.displayName || user?.username}
                        src={getAvatarUrl(user?.avatar)}
                        cursor="pointer"
                      />
                      <Text fontWeight="medium" display={{ base: 'none', lg: 'block' }}>
                        {user?.displayName || user?.username}
                      </Text>
                    </HStack>
                  </MenuButton>
                  <MenuList>
                    <Link to="/profile">
                      <MenuItem>👤 {t('profile')}</MenuItem>
                    </Link>
                    <MenuDivider />
                    <MenuItem onClick={handleLogout} color="red.500">🚪 {t('logout')}</MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" color="gray.700">Connexion</Button>
                </Link>
                <Link to="/register">
                  <Button colorScheme="blue" borderRadius="full" px={6}>S'inscrire</Button>
                </Link>
              </>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

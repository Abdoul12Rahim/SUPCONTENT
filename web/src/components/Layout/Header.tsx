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
  IconButton,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon, SettingsIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
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
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();
  const headerBg = useColorModeValue('white', 'gray.800');
  const headerBorder = useColorModeValue('gray.100', 'gray.700');
  const primaryText = useColorModeValue('gray.800', 'whiteAlpha.900');
  const navText = useColorModeValue('gray.600', 'gray.300');
  const navTextActive = useColorModeValue('gray.900', 'white');

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
    <Box bg={headerBg} px={4} shadow="sm" position="sticky" top={0} zIndex={10} borderBottom="1px" borderColor={headerBorder}>
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <HStack spacing={8}>
            <Link to="/">
              <HStack spacing={2}>
                <Text fontSize="3xl">🎮</Text>
                <Text fontSize="xl" fontWeight="bold" color={primaryText}>
                  UNIVERS GAME
                </Text>
              </HStack>
            </Link>

            <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
              <Link to="/">
                <Button 
                  variant="ghost"
                  fontWeight={isActive('/') ? 'bold' : 'normal'}
                  color={isActive('/') ? navTextActive : navText}
                  _hover={{ color: navTextActive }}
                >
                  🏠 Accueil
                </Button>
              </Link>
              <Link to="/games">
                <Button 
                  variant="ghost"
                  fontWeight={isActive('/games') ? 'bold' : 'normal'}
                  color={isActive('/games') ? navTextActive : navText}
                  _hover={{ color: navTextActive }}
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
                      color={(isActive('/library') || isActive('/reviews') || isActive('/feed')) ? navTextActive : navText}
                      _hover={{ color: navTextActive }}
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
                      color={isActive('/discover') ? navTextActive : navText}
                      _hover={{ color: navTextActive }}
                    >
                      🔍 Découvrir
                    </Button>
                  </Link>
                  
                  <Link to="/messages">
                    <Box position="relative">
                      <Button 
                        variant="ghost"
                        fontWeight={isActive('/messages') ? 'bold' : 'normal'}
                        color={isActive('/messages') ? navTextActive : navText}
                        _hover={{ color: navTextActive }}
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
            <IconButton
              aria-label={colorMode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
              variant="ghost"
              onClick={toggleColorMode}
            />

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

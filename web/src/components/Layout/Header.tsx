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
  useColorMode,
  useColorModeValue, // Ajouté pour contrôler le thème de l'application
} from '@chakra-ui/react';
import { SearchIcon, BellIcon, SettingsIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
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
  const { colorMode, toggleColorMode } = useColorMode(); // Hook Chakra UI pour le thème
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
  
  const navColor = '#94a3b8';
  const navActive = '#a78bfa';

  return (
    <Box
      bg={headerBg}
      backdropFilter="saturate(140%) blur(8px)"
      px={4}
      shadow="sm"
      position="sticky"
      top={0}
      zIndex={10}
      borderBottom="1px"
      borderColor={headerBorder}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <HStack spacing={8}>
            <Link to="/">
              <HStack spacing={2}>
                <Text fontSize="3xl">🎮</Text>
                <Text fontSize="xl" fontWeight="bold" color={primaryText}>
                  SUPCONTENT
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
                    <MenuList
                      bg="ui.card"
                      border="1px solid"
                      borderColor="ui.border"
                      boxShadow="0 12px 30px rgba(0,0,0,0.45)"
                    >
                      <Link to="/library">
                        <MenuItem
                          icon={<Text>📚</Text>}
                          color="ui.text"
                          bg="transparent"
                          _hover={{ bg: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}
                          _focus={{ bg: 'rgba(124,58,237,0.18)', color: '#ddd6fe' }}
                        >
                          Ma Collection
                        </MenuItem>
                      </Link>
                      <Link to="/collaborative-lists">
                        <MenuItem
                          icon={<Text>👥</Text>}
                          color="ui.text"
                          bg="transparent"
                          _hover={{ bg: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}
                          _focus={{ bg: 'rgba(124,58,237,0.18)', color: '#ddd6fe' }}
                        >
                          Listes Partagées
                        </MenuItem>
                      </Link>
                      <Link to="/reviews">
                        <MenuItem
                          icon={<Text>✍️</Text>}
                          color="ui.text"
                          bg="transparent"
                          _hover={{ bg: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}
                          _focus={{ bg: 'rgba(124,58,237,0.18)', color: '#ddd6fe' }}
                        >
                          Mes Critiques
                        </MenuItem>
                      </Link>
                      <Link to="/feed">
                        <MenuItem
                          icon={<Text>📰</Text>}
                          color="ui.text"
                          bg="transparent"
                          _hover={{ bg: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}
                          _focus={{ bg: 'rgba(124,58,237,0.18)', color: '#ddd6fe' }}
                        >
                          Mon Feed
                        </MenuItem>
                      </Link>
                    </MenuList>
                  </Menu>
                  
                  <Link to="/discover">
                    <Button 
                      variant="ghost"
                      fontWeight={isActive('/discover') ? 'bold' : 'normal'}
                      color={isActive('/discover') ? navActive : navColor}
                      _hover={{ color: navActive, bg: 'rgba(124,58,237,0.15)' }}
                    >
                      🔍 Découvrir
                    </Button>
                  </Link>

                  <Link to="/rooms">
                    <Button
                      variant="ghost"
                      fontWeight={isActive('/rooms') ? 'bold' : 'normal'}
                      color={isActive('/rooms') ? navActive : navColor}
                      _hover={{ color: navActive, bg: 'rgba(124,58,237,0.15)' }}
                    >
                      👥 Salons
                    </Button>
                  </Link>
                  
                  <Link to="/messages">
                    <Box position="relative">
                      <Button 
                        variant="ghost"
                        fontWeight={isActive('/messages') ? 'bold' : 'normal'}
                        color={isActive('/messages') ? navActive : navColor}
                        _hover={{ color: navActive, bg: 'rgba(124,58,237,0.15)' }}
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
            {/* BOUTON SOMBRE/CLAIR UNIQUE (Placé ici pour s'adapter à la fois aux invités et aux connectés) */}
            <IconButton
              aria-label="Toggle Theme"
              icon={<Text fontSize="lg">{colorMode === 'light' ? <MoonIcon /> : <SunIcon />}</Text>}
              variant="ghost"
              color={navColor}
              _hover={{ bg: 'rgba(124,58,237,0.15)', color: navActive }}
              onClick={toggleColorMode}
            />

            {isAuthenticated ? (
              <>
                <NotificationBell />
                
                <IconButton
                  aria-label="Settings"
                  icon={<SettingsIcon />}
                  variant="ghost"
                  color={navColor}
                  _hover={{ bg: 'rgba(124,58,237,0.15)', color: navActive }}
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
                  <MenuList
                    bg="ui.card"
                    border="1px solid"
                    borderColor="ui.border"
                    boxShadow="0 12px 30px rgba(0,0,0,0.45)"
                  >
                    <Link to="/profile">
                      <MenuItem
                        color="ui.text"
                        _hover={{ bg: 'rgba(124,58,237,0.15)', color: '#ddd6fe' }}
                        _focus={{ bg: 'rgba(124,58,237,0.18)', color: '#ddd6fe' }}
                      >
                        👤 {t('profile')}
                      </MenuItem>
                    </Link>
                    <MenuDivider borderColor="ui.border" />
                    <MenuItem
                      onClick={handleLogout}
                      color="#fca5a5"
                      _hover={{ bg: 'rgba(239,68,68,0.14)', color: '#f87171' }}
                      _focus={{ bg: 'rgba(239,68,68,0.18)', color: '#f87171' }}
                    >
                      🚪 {t('logout')}
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" color="#a78bfa" _hover={{ bg: 'rgba(124,58,237,0.15)' }}>Connexion</Button>
                </Link>
                <Link to="/register">
                  <Button bg="#7c3aed" color="white" px={6} _hover={{ bg: '#6d28d9' }}>S'inscrire</Button>
                </Link>
              </>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};
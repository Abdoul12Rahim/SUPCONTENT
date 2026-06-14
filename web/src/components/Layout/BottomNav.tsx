import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { useAuth } from '../../contexts/AuthContext';

const C = {
  primary: '#7c3aed',
  panelBg: 'rgba(13,13,20,0.97)',
  panelBorder: 'rgba(124,58,237,0.2)',
  textMuted: '#64748b',
};

const NAV_ITEMS = [
  { path: '/',          label: 'Accueil',   icon: '🏠' },
  { path: '/games',     label: 'Jeux',      icon: '🕹️' },
  { path: '/rooms',     label: 'Salons',    icon: '💬' },
  { path: '/messages',  label: 'Messages',  icon: '✉️', badge: true },
  { path: '/profile',   label: 'Profil',    icon: '👤' },
];

export const BottomNav = () => {
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <Box
      display={{ base: 'flex', md: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={20}
      bg={C.panelBg}
      borderTop={`1px solid ${C.panelBorder}`}
      backdropFilter="blur(12px)"
      pb="env(safe-area-inset-bottom)"
    >
      <Flex w="full" justify="space-around" py={2}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          // Masque Profil et Messages si non connecté
          if (!isAuthenticated && (item.path === '/profile' || item.path === '/messages')) {
            return null;
          }
          return (
            <Link to={item.path} key={item.path} style={{ flex: 1 }}>
              <VStack spacing={0.5} align="center" position="relative">
                <Box position="relative">
                  <Text fontSize="xl">{item.icon}</Text>
                  {item.badge && unreadCount > 0 && (
                    <Box
                      position="absolute" top="-4px" right="-6px"
                      bg="#ef4444" color="white" borderRadius="full"
                      fontSize="9px" minW="16px" h="16px"
                      display="flex" alignItems="center" justifyContent="center"
                      fontWeight="bold"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Box>
                  )}
                </Box>
                <Text
                  fontSize="10px"
                  color={active ? C.primary : C.textMuted}
                  fontWeight={active ? '700' : '400'}
                >
                  {item.label}
                </Text>
                {active && (
                  <Box
                    w="20px" h="3px" borderRadius="full"
                    bg={C.primary} mt="1px"
                  />
                )}
              </VStack>
            </Link>
          );
        })}
      </Flex>
    </Box>
  );
};

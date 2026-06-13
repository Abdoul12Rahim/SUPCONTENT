import {
  Box, Flex, Text, Input, InputGroup, InputLeftElement,
  VStack, HStack, Avatar, Badge, Button, IconButton,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, ModalCloseButton,
  Textarea, Switch, FormControl, FormLabel,
  useDisclosure, useToast, Divider, Tooltip,
  SimpleGrid, Container,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ─── Palette identique au mobile ───────────────────────────────────────────
const C = {
  primary: '#7c3aed',
  primaryLight: 'rgba(124,58,237,0.15)',
  primaryBorder: 'rgba(124,58,237,0.25)',
  bgDark: '#0d0d14',
  surface: '#13131f',
  surfaceElevated: '#1a1a2e',
  border: 'rgba(255,255,255,0.06)',
  textLight: '#f1f5f9',
  textMuted: '#64748b',
  accentGreen: '#10b981',
  danger: '#ef4444',
};

// ─── Données de démo (identiques au mobile) ───────────────────────────────
const GAME_OPTIONS = [
  { id: '1', name: 'GTA VI', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Valorant', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Elden Ring', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&q=80' },
  { id: '4', name: 'Fortnite', image: 'https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=200&q=80' },
  { id: '5', name: 'Minecraft', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=200&q=80' },
];

const INITIAL_ROOMS = [
  {
    id: '101', game: 'GTA VI',
    image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80',
    description: 'Le salon officiel GTA VI — missions, spots, crews.',
    lastMessage: "Quelqu'un pour une session ce soir ?",
    lastTime: '14:05', unread: 3, isPublic: true, joined: false,
    members: [
      { id: 'a1', name: 'XtremeGamer', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80', isAdmin: true },
      { id: 'a2', name: 'NightRider_99', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80', isAdmin: false },
    ],
    rules: ['Respect entre membres', 'Pas de spam', 'Parlez uniquement de GTA VI'],
    messages: [
      { id: 'm1', senderId: 'a1', senderName: 'XtremeGamer', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80', content: 'Bienvenue dans le salon GTA VI ! 🎮', time: '14:00' },
      { id: 'm2', senderId: 'a2', senderName: 'NightRider_99', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80', content: "Quelqu'un pour une session ce soir ?", time: '14:05' },
    ],
  },
  {
    id: '102', game: 'Valorant',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80',
    description: 'Team up, rank up. Salon compétitif Valorant.',
    lastMessage: 'Ranking session ce soir 20h !',
    lastTime: '12:30', unread: 1, isPublic: true, joined: false,
    members: [
      { id: 'b1', name: 'ProShooter', avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=100&q=80', isAdmin: true },
    ],
    rules: ['Bon niveau requis', 'Pas de toxic behavior'],
    messages: [
      { id: 'm1', senderId: 'b1', senderName: 'ProShooter', avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=100&q=80', content: 'Ranking session ce soir 20h !', time: '12:30' },
    ],
  },
  {
    id: '103', game: 'Elden Ring',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&q=80',
    description: 'Pour les Tarnished. Boss rush, lore, speedrun.',
    lastMessage: 'Nouveau patch ! Malenia nerfée enfin 😤',
    lastTime: '10:00', unread: 0, isPublic: false, joined: false,
    members: [
      { id: 'c1', name: 'SoulBorn', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80', isAdmin: true },
    ],
    rules: ['Pas de spoilers sans avertissement', 'Entraide bienvenue'],
    messages: [
      { id: 'm1', senderId: 'c1', senderName: 'SoulBorn', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80', content: 'Nouveau patch ! Malenia nerfée enfin 😤', time: '10:00' },
    ],
  },
];

type Room = typeof INITIAL_ROOMS[0];
type Message = { id: string; senderId: string; senderName: string; avatar: string; content: string; time: string };

export const Rooms = () => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRoom, setPendingRoom] = useState<Room | null>(null);

  // Modals
  const rulesModal = useDisclosure();
  const previewModal = useDisclosure();
  const createModal = useDisclosure();
  const [previewRoom, setPreviewRoom] = useState<Room | null>(null);

  // Create room form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPublic, setNewRoomPublic] = useState(true);
  const [selectedGame, setSelectedGame] = useState<typeof GAME_OPTIONS[0] | null>(null);

  const filteredRooms = rooms.filter(
    (r) =>
      r.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openPreview = (room: Room) => {
    setPreviewRoom(room);
    previewModal.onOpen();
  };

  const handleJoin = (room: Room) => {
    previewModal.onClose();
    if (room.joined) { setActiveRoom(room); return; }
    setPendingRoom(room);
    rulesModal.onOpen();
  };

  const confirmJoin = () => {
    if (!pendingRoom) return;
    if (!pendingRoom.isPublic) {
      toast({ title: 'Demande envoyée', description: "Un admin devra approuver ta demande.", status: 'info', duration: 4000 });
      rulesModal.onClose();
      setPendingRoom(null);
      return;
    }
    const updated = { ...pendingRoom, joined: true, unread: 0 };
    setRooms((prev) => prev.map((r) => (r.id === pendingRoom.id ? updated : r)));
    setActiveRoom(updated);
    rulesModal.onClose();
    setPendingRoom(null);
  };

  const leaveRoom = () => {
    if (!activeRoom) return;
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? { ...r, joined: false } : r)));
    setActiveRoom(null);
    toast({ title: 'Salon quitté', status: 'warning', duration: 3000 });
  };

  const sendMessage = () => {
    if (!inputText.trim() || !activeRoom) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: 'me',
      senderName: user?.username || 'Moi',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      content: inputText.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = { ...activeRoom, messages: [...activeRoom.messages, msg] };
    setRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updated : r)));
    setActiveRoom(updated);
    setInputText('');
  };

  const handleCreate = () => {
    if (!newRoomName.trim() || !selectedGame) {
      toast({ title: 'Remplis le nom et le jeu', status: 'error', duration: 3000 });
      return;
    }
    const newRoom: Room = {
      id: `r${Date.now()}`,
      game: selectedGame.name,
      image: selectedGame.image,
      description: newRoomDesc || `Salon ${selectedGame.name}`,
      lastMessage: 'Salon créé !',
      lastTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      isPublic: newRoomPublic,
      joined: true,
      members: [{ id: 'me', name: user?.username || 'Moi', avatar: '', isAdmin: true }],
      rules: [],
      messages: [{ id: 'm1', senderId: 'me', senderName: user?.username || 'Moi', avatar: '', content: `Salon ${newRoomName} créé ! 🎮`, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }],
    };
    setRooms((prev) => [newRoom, ...prev]);
    setActiveRoom(newRoom);
    createModal.onClose();
    setNewRoomName(''); setNewRoomDesc(''); setSelectedGame(null);
    toast({ title: 'Salon créé !', status: 'success', duration: 3000 });
  };

  // ── Layout : liste à gauche, chat à droite ────────────────────────────────
  return (
    <Box bg={C.bgDark} minH="calc(100vh - 64px)">
      <Container maxW="container.xl" py={4}>
        <Flex gap={4} h="calc(100vh - 120px)">

          {/* ── Colonne gauche : liste des salons ── */}
          <Box
            w={{ base: activeRoom ? '0' : 'full', md: '340px' }}
            display={{ base: activeRoom ? 'none' : 'flex', md: 'flex' }}
            flexDir="column"
            bg={C.surface}
            borderRadius="xl"
            border={`1px solid ${C.border}`}
            overflow="hidden"
            flexShrink={0}
          >
            {/* Header */}
            <Box p={4} borderBottom={`1px solid ${C.border}`}>
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontWeight="bold" fontSize="lg" color={C.textLight}>
                  🎮 Salons
                </Text>
                <Tooltip label="Créer un salon">
                  <IconButton
                    aria-label="Créer salon"
                    icon={<AddIcon />}
                    size="sm"
                    bg={C.primaryLight}
                    color={C.primary}
                    borderRadius="full"
                    _hover={{ bg: C.primaryBorder }}
                    onClick={createModal.onOpen}
                  />
                </Tooltip>
              </Flex>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color={C.textMuted} />
                </InputLeftElement>
                <Input
                  placeholder="Rechercher un salon..."
                  bg={C.surfaceElevated}
                  border="none"
                  color={C.textLight}
                  _placeholder={{ color: C.textMuted }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </Box>

            {/* Liste */}
            <VStack spacing={0} overflowY="auto" flex={1} align="stretch">
              {filteredRooms.map((room) => (
                <Box
                  key={room.id}
                  px={4} py={3}
                  cursor="pointer"
                  borderBottom={`1px solid ${C.border}`}
                  bg={activeRoom?.id === room.id ? C.primaryLight : 'transparent'}
                  _hover={{ bg: C.primaryLight }}
                  onClick={() => openPreview(room)}
                >
                  <HStack spacing={3}>
                    <Box
                      w="44px" h="44px" borderRadius="lg" overflow="hidden"
                      border={`1px solid ${C.primaryBorder}`} flexShrink={0}
                    >
                      <img src={room.image} alt={room.game} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Box flex={1} minW={0}>
                      <Flex justify="space-between" align="center">
                        <HStack spacing={1}>
                          <Text fontWeight="600" fontSize="sm" color={C.textLight} noOfLines={1}>
                            {room.game}
                          </Text>
                          {!room.isPublic && <LockIcon boxSize={3} color={C.textMuted} />}
                        </HStack>
                        <HStack spacing={1}>
                          <Text fontSize="xs" color={C.textMuted}>{room.lastTime}</Text>
                          {room.unread > 0 && (
                            <Badge bg={C.primary} color="white" borderRadius="full" fontSize="xs" minW="18px" textAlign="center">
                              {room.unread}
                            </Badge>
                          )}
                        </HStack>
                      </Flex>
                      <Text fontSize="xs" color={C.textMuted} noOfLines={1}>{room.lastMessage}</Text>
                    </Box>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>

          {/* ── Colonne droite : chat actif ── */}
          {activeRoom ? (
            <Flex flex={1} flexDir="column" bg={C.surface} borderRadius="xl" border={`1px solid ${C.border}`} overflow="hidden">
              {/* Chat header */}
              <Flex px={4} py={3} align="center" borderBottom={`1px solid ${C.border}`} gap={3}>
                <IconButton
                  aria-label="Retour"
                  icon={<Text>←</Text>}
                  size="sm" variant="ghost" color={C.textMuted}
                  display={{ md: 'none' }}
                  onClick={() => setActiveRoom(null)}
                />
                <Box w="36px" h="36px" borderRadius="md" overflow="hidden">
                  <img src={activeRoom.image} alt={activeRoom.game} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Box flex={1}>
                  <Text fontWeight="bold" fontSize="sm" color={C.textLight}>{activeRoom.game}</Text>
                  <Text fontSize="xs" color={C.textMuted}>{activeRoom.members.length} membres</Text>
                </Box>
                <Button size="xs" variant="outline" colorScheme="red" onClick={leaveRoom}>
                  Quitter
                </Button>
              </Flex>

              {/* Messages */}
              <VStack flex={1} overflowY="auto" p={4} spacing={3} align="stretch">
                {activeRoom.messages.map((msg) => {
                  const isMe = msg.senderId === 'me';
                  return (
                    <Flex key={msg.id} justify={isMe ? 'flex-end' : 'flex-start'} gap={2}>
                      {!isMe && <Avatar size="xs" src={msg.avatar} name={msg.senderName} />}
                      <Box maxW="70%">
                        {!isMe && (
                          <Text fontSize="xs" color={C.primary} fontWeight="600" mb={0.5}>{msg.senderName}</Text>
                        )}
                        <Box
                          px={3} py={2} borderRadius="xl"
                          bg={isMe ? C.primary : C.surfaceElevated}
                          color={C.textLight}
                          borderBottomRightRadius={isMe ? 'sm' : 'xl'}
                          borderBottomLeftRadius={isMe ? 'xl' : 'sm'}
                        >
                          <Text fontSize="sm">{msg.content}</Text>
                        </Box>
                        <Text fontSize="xs" color={C.textMuted} mt={0.5} textAlign={isMe ? 'right' : 'left'}>
                          {msg.time}
                        </Text>
                      </Box>
                    </Flex>
                  );
                })}
              </VStack>

              {/* Input */}
              {isAuthenticated ? (
                <HStack p={3} borderTop={`1px solid ${C.border}`} spacing={2}>
                  <Input
                    placeholder="Écris un message..."
                    bg={C.surfaceElevated}
                    border="none"
                    color={C.textLight}
                    _placeholder={{ color: C.textMuted }}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    borderRadius="full"
                  />
                  <Button
                    bg={C.primary} color="white" borderRadius="full" px={5}
                    _hover={{ bg: '#6d28d9' }} onClick={sendMessage}
                  >
                    Envoyer
                  </Button>
                </HStack>
              ) : (
                <Box p={3} textAlign="center" borderTop={`1px solid ${C.border}`}>
                  <Text fontSize="sm" color={C.textMuted}>
                    <a href="/login" style={{ color: C.primary }}>Connecte-toi</a> pour participer
                  </Text>
                </Box>
              )}
            </Flex>
          ) : (
            <Flex
              flex={1} align="center" justify="center" flexDir="column" gap={3}
              display={{ base: 'none', md: 'flex' }}
            >
              <Text fontSize="4xl">🎮</Text>
              <Text color={C.textMuted}>Sélectionne un salon pour discuter</Text>
              <Button bg={C.primary} color="white" onClick={createModal.onOpen}>
                Créer un salon
              </Button>
            </Flex>
          )}
        </Flex>
      </Container>

      {/* ── Modal Aperçu salon ── */}
      <Modal isOpen={previewModal.isOpen} onClose={previewModal.onClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={C.surface} border={`1px solid ${C.border}`} color={C.textLight}>
          {previewRoom && (
            <>
              <ModalCloseButton color={C.textMuted} />
              <ModalHeader pb={2}>{previewRoom.game}</ModalHeader>
              <ModalBody>
                <Box
                  w="full" h="140px" borderRadius="lg" overflow="hidden" mb={3}
                  border={`1px solid ${C.primaryBorder}`}
                >
                  <img src={previewRoom.image} alt={previewRoom.game} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Text fontSize="sm" color={C.textMuted} mb={3}>{previewRoom.description}</Text>
                <HStack spacing={2} mb={3}>
                  <Badge bg={previewRoom.isPublic ? C.accentGreen : C.primary} color="white">
                    {previewRoom.isPublic ? '🔓 Public' : '🔒 Privé'}
                  </Badge>
                  <Badge bg={C.primaryLight} color={C.primary}>{previewRoom.members.length} membres</Badge>
                </HStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" color={C.textMuted} mr={3} onClick={previewModal.onClose}>Fermer</Button>
                <Button bg={C.primary} color="white" onClick={() => handleJoin(previewRoom)}>
                  {previewRoom.joined ? 'Ouvrir' : 'Rejoindre'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ── Modal Règles ── */}
      <Modal isOpen={rulesModal.isOpen} onClose={rulesModal.onClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={C.surface} border={`1px solid ${C.border}`} color={C.textLight}>
          <ModalHeader>📋 Règles du salon</ModalHeader>
          <ModalCloseButton color={C.textMuted} />
          <ModalBody>
            <VStack align="start" spacing={2}>
              {pendingRoom?.rules.map((r, i) => (
                <HStack key={i} spacing={2}>
                  <Text color={C.primary}>•</Text>
                  <Text fontSize="sm">{r}</Text>
                </HStack>
              ))}
            </VStack>
            {!pendingRoom?.isPublic && (
              <Box mt={3} p={3} bg={C.primaryLight} borderRadius="md">
                <Text fontSize="sm" color={C.primary}>
                  ⚠️ Ce salon est privé. Ta demande devra être approuvée par un admin.
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color={C.textMuted} mr={3} onClick={rulesModal.onClose}>Annuler</Button>
            <Button bg={C.primary} color="white" onClick={confirmJoin}>
              {pendingRoom?.isPublic ? 'Accepter et rejoindre' : 'Envoyer la demande'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Modal Créer salon ── */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={C.surface} border={`1px solid ${C.border}`} color={C.textLight}>
          <ModalHeader>✨ Créer un salon</ModalHeader>
          <ModalCloseButton color={C.textMuted} />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" color={C.textMuted}>Nom du salon</FormLabel>
                <Input
                  placeholder="Ex : GTA VI Squad"
                  bg={C.surfaceElevated} border="none" color={C.textLight}
                  value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={C.textMuted}>Description (optionnel)</FormLabel>
                <Textarea
                  placeholder="Décris ton salon..."
                  bg={C.surfaceElevated} border="none" color={C.textLight} rows={2}
                  value={newRoomDesc} onChange={(e) => setNewRoomDesc(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" color={C.textMuted}>Jeu associé</FormLabel>
                <SimpleGrid columns={3} spacing={2}>
                  {GAME_OPTIONS.map((g) => (
                    <Box
                      key={g.id}
                      p={2} borderRadius="lg" cursor="pointer" textAlign="center"
                      border={`1px solid ${selectedGame?.id === g.id ? C.primary : C.border}`}
                      bg={selectedGame?.id === g.id ? C.primaryLight : C.surfaceElevated}
                      onClick={() => setSelectedGame(g)}
                    >
                      <Box w="full" h="36px" mb={1} borderRadius="md" overflow="hidden">
                        <img src={g.image} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Text fontSize="xs" color={C.textLight} noOfLines={1}>{g.name}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </FormControl>
              <FormControl>
                <Flex justify="space-between" align="center">
                  <FormLabel fontSize="sm" color={C.textMuted} mb={0}>
                    {newRoomPublic ? <UnlockIcon mr={1} /> : <LockIcon mr={1} />}
                    {newRoomPublic ? 'Salon public' : 'Salon privé (sur invitation)'}
                  </FormLabel>
                  <Switch
                    isChecked={newRoomPublic}
                    onChange={(e) => setNewRoomPublic(e.target.checked)}
                    colorScheme="purple"
                  />
                </Flex>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color={C.textMuted} mr={3} onClick={createModal.onClose}>Annuler</Button>
            <Button bg={C.primary} color="white" onClick={handleCreate}>
              Créer le salon
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

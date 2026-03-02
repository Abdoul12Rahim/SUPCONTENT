import { 
  Box, 
  Container, 
  Heading, 
  VStack, 
  HStack,
  Text,
  Avatar,
  Input,
  Button,
  IconButton,
  Flex,
  Spinner,
  Badge,
  useToast,
  Divider,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { ArrowBackIcon, DeleteIcon, CloseIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  read: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  }>;
  otherParticipant: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  lastMessage?: {
    content: string;
    sender?: {
      username: string;
      displayName?: string;
    };
    createdAt: string;
  };
  unreadCount: number;
  lastMessageAt?: string;
}

export const Messages = () => {
  const { isAuthenticated, user } = useAuth();
  const { socket } = useSocket();
  const { refetch: refetchUnreadCount, decrementCount } = useUnreadMessages();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Charger les conversations au montage
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  // Gérer l'ouverture d'une conversation depuis les paramètres URL
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c._id === conversationId);
      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [searchParams, conversations]);

  // Socket.io : écouter les nouveaux messages
  useEffect(() => {
    if (socket && isAuthenticated) {
      const handleNewMessage = (data: { conversationId: string; message: Message }) => {
        // Si c'est la conversation active, ajouter le message et marquer comme lu
        if (selectedConversation?._id === data.conversationId) {
          setMessages((prev) => [...prev, data.message]);
          // Marquer immédiatement comme lu et décrémenter le badge (car il vient d'être incrémenté)
          markAsRead(data.conversationId, 1);
        }
        // Rafraîchir la liste des conversations
        fetchConversations();
      };

      const handleMessageDeleted = (data: { conversationId: string; messageId: string }) => {
        // Si c'est la conversation active, retirer le message
        if (selectedConversation?._id === data.conversationId) {
          setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
        }
        // Rafraîchir la liste des conversations
        fetchConversations();
      };

      socket.on('new_message', handleNewMessage);
      socket.on('message_deleted', handleMessageDeleted);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('message_deleted', handleMessageDeleted);
      };
    }
  }, [socket, isAuthenticated, selectedConversation]);

  // Scroller vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data.conversations);
    } catch (error: any) {
      console.error('Erreur lors du chargement des conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setLoading(true);

    // Sauvegarder le nombre de messages non lus avant de charger
    const unreadCount = conversation.unreadCount;

    try {
      const response = await api.get(`/messages/conversations/${conversation._id}/messages`);
      setMessages(response.data.messages);

      // Si la conversation avait des messages non lus, les marquer comme lus
      if (unreadCount > 0) {
        await markAsRead(conversation._id, unreadCount);
      }

      // Mettre à jour le compteur non lu localement
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversation._id ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (conversationId: string, unreadCount: number = 0) => {
    try {
      await api.put(`/messages/conversations/${conversationId}/read`);
      // Décrémenter localement le badge pour un feedback instantané
      if (unreadCount > 0) {
        decrementCount(unreadCount);
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.delete(`/messages/messages/${messageId}`);
      // La suppression sera gérée par Socket.io
      toast({
        title: 'Message supprimé',
        status: 'success',
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer le message',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);

    try {
      const response = await api.post(
        `/messages/conversations/${selectedConversation._id}/messages`,
        { content: newMessage }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');

      // Rafraîchir les conversations pour mettre à jour lastMessage
      fetchConversations();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Heading mb={4}>Messages</Heading>
          <Text>Veuillez vous connecter pour accéder à vos messages</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>💬 Messages</Heading>

      <Flex h="600px" bg="white" borderRadius="lg" shadow="md" overflow="hidden">
        {/* Liste des conversations */}
        <Box
          w={{ base: selectedConversation ? '0' : '100%', md: '350px' }}
          borderRight="1px"
          borderColor="gray.200"
          overflowY="auto"
          display={{ base: selectedConversation ? 'none' : 'block', md: 'block' }}
        >
          {loading ? (
            <Flex justify="center" align="center" h="100%">
              <Spinner size="lg" color="blue.500" />
            </Flex>
          ) : conversations.length === 0 ? (
            <Box p={6} textAlign="center">
              <Text color="gray.500" mb={4}>
                Aucune conversation
              </Text>
              <Text fontSize="sm" color="gray.400">
                Commencez une conversation en visitant le profil d'un utilisateur !
              </Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch">
              {conversations.map((conversation) => (
                <Box
                  key={conversation._id}
                  p={4}
                  cursor="pointer"
                  bg={
                    selectedConversation?._id === conversation._id
                      ? 'blue.50'
                      : 'transparent'
                  }
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => handleSelectConversation(conversation)}
                  borderBottom="1px"
                  borderColor="gray.100"
                >
                  <HStack spacing={3} align="start">
                    <Avatar
                      size="md"
                      name={
                        conversation.otherParticipant.displayName ||
                        conversation.otherParticipant.username
                      }
                      src={getAvatarUrl(conversation.otherParticipant.avatar)}
                    />
                    <VStack align="start" spacing={0} flex={1} overflow="hidden">
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="semibold" isTruncated>
                          {conversation.otherParticipant.displayName ||
                            conversation.otherParticipant.username}
                        </Text>
                        {conversation.unreadCount > 0 && (
                          <Badge colorScheme="blue" borderRadius="full">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </HStack>
                      {conversation.lastMessage && (
                        <Text fontSize="sm" color="gray.500" isTruncated w="full">
                          {conversation.lastMessage.content}
                        </Text>
                      )}
                      {conversation.lastMessageAt && (
                        <Text fontSize="xs" color="gray.400">
                          {formatMessageTime(conversation.lastMessageAt)}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        {/* Zone de chat */}
        <Flex
          flex={1}
          direction="column"
          display={{ base: selectedConversation ? 'flex' : 'none', md: 'flex' }}
        >
          {selectedConversation ? (
            <>
              {/* Header du chat */}
              <Flex
                p={4}
                borderBottom="1px"
                borderColor="gray.200"
                align="center"
                bg="gray.50"
                justify="space-between"
              >
                <HStack spacing={2} flex={1}>
                  <IconButton
                    aria-label="Retour"
                    icon={<ArrowBackIcon />}
                    variant="ghost"
                    display={{ base: 'flex', md: 'none' }}
                    onClick={() => setSelectedConversation(null)}
                  />
                  <Avatar
                    size="sm"
                    name={
                      selectedConversation.otherParticipant.displayName ||
                      selectedConversation.otherParticipant.username
                    }
                    src={getAvatarUrl(selectedConversation.otherParticipant.avatar)}
                    cursor="pointer"
                    onClick={() =>
                      navigate(`/profile/${selectedConversation.otherParticipant._id}`)
                    }
                  />
                  <VStack align="start" spacing={0}>
                    <Text
                      fontWeight="semibold"
                      cursor="pointer"
                      _hover={{ color: 'blue.500' }}
                      onClick={() =>
                        navigate(`/profile/${selectedConversation.otherParticipant._id}`)
                      }
                    >
                      {selectedConversation.otherParticipant.displayName ||
                        selectedConversation.otherParticipant.username}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      @{selectedConversation.otherParticipant.username}
                    </Text>
                  </VStack>
                </HStack>
                <IconButton
                  aria-label="Fermer la discussion"
                  icon={<CloseIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  display={{ base: 'none', md: 'flex' }}
                />
              </Flex>

              {/* Messages */}
              <Box flex={1} overflowY="auto" p={4} bg="gray.50">
                {loading ? (
                  <Flex justify="center" align="center" h="100%">
                    <Spinner size="lg" color="blue.500" />
                  </Flex>
                ) : messages.length === 0 ? (
                  <Flex justify="center" align="center" h="100%">
                    <Text color="gray.500">Aucun message pour le moment</Text>
                  </Flex>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {messages.map((message) => {
                      const isOwn = message.sender._id === user?._id;
                      return (
                        <Flex
                          key={message._id}
                          justify={isOwn ? 'flex-end' : 'flex-start'}
                          position="relative"
                          role="group"
                        >
                          <Flex gap={2} align="flex-end" direction={isOwn ? 'row-reverse' : 'row'}>
                            <Box
                              maxW="70%"
                              bg={isOwn ? 'blue.500' : 'white'}
                              color={isOwn ? 'white' : 'black'}
                              px={4}
                              py={2}
                              borderRadius="lg"
                              shadow="sm"
                              wordBreak="break-word"
                              whiteSpace="pre-wrap"
                            >
                              <Text wordBreak="break-word" whiteSpace="pre-wrap">{message.content}</Text>
                              <Text
                                fontSize="xs"
                                color={isOwn ? 'blue.100' : 'gray.500'}
                                textAlign="right"
                                mt={1}
                              >
                                {formatMessageTime(message.createdAt)}
                              </Text>
                            </Box>
                            {isOwn && (
                              <IconButton
                                aria-label="Supprimer le message"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                opacity={0}
                                _groupHover={{ opacity: 1 }}
                                transition="opacity 0.2s"
                                onClick={() => handleDeleteMessage(message._id)}
                                flexShrink={0}
                              />
                            )}
                          </Flex>
                        </Flex>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </VStack>
                )}
              </Box>

              {/* Input pour envoyer un message */}
              <Box p={4} borderTop="1px" borderColor="gray.200" bg="white">
                <form onSubmit={handleSendMessage}>
                  <InputGroup>
                    <Input
                      placeholder="Écrivez un message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMessage}
                      pr="4.5rem"
                    />
                    <InputRightElement width="4.5rem">
                      <IconButton
                        aria-label="Envoyer"
                        icon={<Text>📤</Text>}
                        colorScheme="blue"
                        size="sm"
                        type="submit"
                        isLoading={sendingMessage}
                        disabled={!newMessage.trim()}
                      />
                    </InputRightElement>
                  </InputGroup>
                </form>
              </Box>
            </>
          ) : (
            <Flex justify="center" align="center" h="100%">
              <VStack spacing={2}>
                <Text fontSize="4xl">💬</Text>
                <Text color="gray.500">
                  Sélectionnez une conversation pour commencer
                </Text>
              </VStack>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Container>
  );
};

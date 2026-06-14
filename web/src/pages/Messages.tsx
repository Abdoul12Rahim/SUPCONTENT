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
  InputLeftElement,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { ArrowBackIcon, DeleteIcon, CloseIcon, SearchIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

interface Message {
  _id: string;
  content: string;
  messageType?: 'text' | 'voice';
  audioUrl?: string;
  audioMimeType?: string;
  audioDuration?: number;
  sender: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  read: boolean;
  createdAt: string;
  likedBy?: Array<{ user: string; likedAt?: string }>;
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
    messageType?: 'text' | 'voice';
    audioDuration?: number;
    sender?: {
      username: string;
      displayName?: string;
    };
    createdAt: string;
  };
  unreadCount: number;
  lastMessageAt?: string;
}

interface UserSearchItem {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
}

export const Messages = () => {
  const { isAuthenticated, user } = useAuth();
  const { socket } = useSocket();
  const { decrementCount, refetch: refetchUnreadCount } = useUnreadMessages();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationQuery, setConversationQuery] = useState('');
  const [friendResults, setFriendResults] = useState<UserSearchItem[]>([]);
  const [searchingFriends, setSearchingFriends] = useState(false);
  const [startingConversationId, setStartingConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [pendingVoiceBlob, setPendingVoiceBlob] = useState<Blob | null>(null);
  const [pendingVoiceUrl, setPendingVoiceUrl] = useState<string | null>(null);
  const [pendingVoiceDuration, setPendingVoiceDuration] = useState(0);
  const contactsFallbackRef = useRef<UserSearchItem[] | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingSecondsRef = useRef(0);
  const discardRecordingRef = useRef(false);
  const recorderMimeTypeRef = useRef<string>('audio/webm');

  // APRÈS — à mettre à la place, dans le composant
const bg            = useColorModeValue('#f8f7ff',               '#0d0d14');
const panel         = useColorModeValue('#ffffff',               '#13131f');
const panelElevated = useColorModeValue('#f0eeff',               '#1a1a2e');
const border        = useColorModeValue('rgba(124,58,237,0.12)', 'rgba(255,255,255,0.08)');
const text          = useColorModeValue('#1a1a2e',               '#f1f5f9');
const muted         = useColorModeValue('#6b7280',               '#94a3b8');
const primary       = '#7c3aed';
const primarySoft   = 'rgba(124,58,237,0.15)';
const primaryBorder = 'rgba(124,58,237,0.35)';

  const C = { bg, panel, panelElevated, border, text, muted, primary, primarySoft, primaryBorder };
  
  const getMediaUrl = (url?: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const apiBase = (import.meta.env.VITE_API_URL || 'https://supcontent-production.up.railway.app/api').replace(/\/api\/?$/, '');
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const formatRecordingTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredConversations = useMemo(() => {
    const q = conversationQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conversation) => {
      const name = (
        conversation.otherParticipant.displayName ||
        conversation.otherParticipant.username ||
        ''
      ).toLowerCase();
      const handle = (conversation.otherParticipant.username || '').toLowerCase();
      const lastMessage = (conversation.lastMessage?.content || '').toLowerCase();
      return name.includes(q) || handle.includes(q) || lastMessage.includes(q);
    });
  }, [conversations, conversationQuery]);

  const searchFriends = async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setFriendResults([]);
      return;
    }

    const normalizeUsers = (payload: any): UserSearchItem[] => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.users)) return payload.users;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    };

    const filterByQuery = (users: UserSearchItem[]) => {
      const lowered = q.toLowerCase();
      const unique = new Map<string, UserSearchItem>();
      users.forEach((u) => {
        if (!u?._id || u._id === user?._id) return;
        const username = (u.username || '').toLowerCase();
        const displayName = (u.displayName || '').toLowerCase();
        if (username.includes(lowered) || displayName.includes(lowered)) {
          unique.set(u._id, u);
        }
      });
      return Array.from(unique.values()).slice(0, 8);
    };

    const loadContactsFallback = async (): Promise<UserSearchItem[]> => {
      if (!user?._id) return [];
      if (contactsFallbackRef.current) return contactsFallbackRef.current;

      const [followersResponse, followingResponse] = await Promise.all([
        api.get(`/social/${user._id}/followers?page=1`),
        api.get(`/social/${user._id}/following?page=1`),
      ]);

      const followers = normalizeUsers(followersResponse.data?.followers || followersResponse.data);
      const following = normalizeUsers(followingResponse.data?.following || followingResponse.data);
      const merged = [...followers, ...following];

      const unique = new Map<string, UserSearchItem>();
      merged.forEach((u) => {
        if (u?._id) unique.set(u._id, u);
      });

      contactsFallbackRef.current = Array.from(unique.values());
      return contactsFallbackRef.current;
    };

    try {
      setSearchingFriends(true);
      const response = await api.get(`/social/search?q=${encodeURIComponent(q)}&page=1`);
      const apiUsers = normalizeUsers(response.data);
      let results = filterByQuery(apiUsers);

      // Fallback: inclure aussi les abonnements de l'utilisateur si la recherche globale ne remonte rien.
      if (results.length === 0) {
        const contactUsers = await loadContactsFallback();
        results = filterByQuery(contactUsers);
      }

      setFriendResults(results);
    } catch (error) {
      console.error('Erreur recherche amis:', error);
    } finally {
      setSearchingFriends(false);
    }
  };

  const handleStartConversation = async (targetUser: UserSearchItem) => {
    try {
      setStartingConversationId(targetUser._id);
      const response = await api.get(`/messages/conversations/with/${targetUser._id}`);
      const createdConversation = response.data as Conversation;

      await fetchConversations();

      // Construire otherParticipant si backend ne le renvoie pas déjà
      const fallbackOther = createdConversation.participants?.find((p) => p._id !== user?._id) || {
        _id: targetUser._id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        avatar: targetUser.avatar,
      };

      const normalizedConversation: Conversation = {
        ...createdConversation,
        otherParticipant: createdConversation.otherParticipant || fallbackOther,
        unreadCount: createdConversation.unreadCount || 0,
      };

      setSelectedConversation(normalizedConversation);
      await handleSelectConversation(normalizedConversation);
      setConversationQuery('');
      setFriendResults([]);
    } catch (error: any) {
      toast({
        title: 'Impossible de démarrer la conversation',
        description: error.response?.data?.message || 'Vérifie que vous vous suivez mutuellement',
        status: 'error',
        duration: 3500,
      });
    } finally {
      setStartingConversationId(null);
    }
  };

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

      const handleMessageLiked = (data: { messageId: string; userId: string; action: 'like' | 'unlike'; likedAt?: string }) => {
        // Mettre à jour le message dans la conversation active
        setMessages((prev) =>
          prev.map((m) => {
            if (m._id !== data.messageId) return m;
            const likedBy = Array.isArray(m.likedBy) ? [...m.likedBy] : [];
            if (data.action === 'like') {
              // éviter les doublons
              if (!likedBy.some((l) => l.user === data.userId)) {
                likedBy.push({ user: data.userId, likedAt: data.likedAt });
              }
            } else {
              // unlike
              const idx = likedBy.findIndex((l) => l.user === data.userId);
              if (idx !== -1) likedBy.splice(idx, 1);
            }
            return { ...m, likedBy };
          })
        );
      };

      socket.on('new_message', handleNewMessage);
      socket.on('message_deleted', handleMessageDeleted);
      socket.on('message_liked', handleMessageLiked);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('message_deleted', handleMessageDeleted);
        socket.off('message_liked', handleMessageLiked);
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
      // Resync with server as source of truth so header badge updates immediately.
      await refetchUnreadCount();
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

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const clearPendingVoiceNote = () => {
    setPendingVoiceBlob(null);
    setPendingVoiceDuration(0);
    if (pendingVoiceUrl) {
      URL.revokeObjectURL(pendingVoiceUrl);
      setPendingVoiceUrl(null);
    }
  };

  const guessAudioExtension = (mimeType?: string) => {
    const value = (mimeType || '').toLowerCase();
    if (value.includes('mp4') || value.includes('aac') || value.includes('m4a')) return 'm4a';
    if (value.includes('mpeg') || value.includes('mp3')) return 'mp3';
    if (value.includes('ogg')) return 'ogg';
    if (value.includes('wav') || value.includes('wave')) return 'wav';
    return 'webm';
  };

  const sendVoiceNote = async (audioBlob: Blob, durationSeconds: number, mimeTypeHint?: string) => {
    if (!selectedConversation) return;

    try {
      setSendingMessage(true);
      const extension = guessAudioExtension(mimeTypeHint || audioBlob.type);
      const formData = new FormData();
      formData.append('audio', audioBlob, `voice-note-${Date.now()}.${extension}`);
      formData.append('audioDuration', String(Math.max(1, durationSeconds)));

      const response = await api.post(
        `/messages/conversations/${selectedConversation._id}/voice-note`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setMessages((prev) => [...prev, response.data]);
      fetchConversations();
      setRecordingSeconds(0);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible d\'envoyer la note vocale',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const startVoiceRecording = async () => {
    if (!selectedConversation) return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast({
        title: 'Micro non supporte',
        description: 'Votre navigateur ne supporte pas l\'enregistrement audio.',
        status: 'warning',
        duration: 3500,
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ];
      const supportedMimeType = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m));
      const recorder = supportedMimeType ? new MediaRecorder(stream, { mimeType: supportedMimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorderMimeTypeRef.current = supportedMimeType || recorder.mimeType || 'audio/webm';
      discardRecordingRef.current = false;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const durationSnapshot = recordingSecondsRef.current;
        clearRecordingTimer();
        setIsRecordingVoice(false);
        stopMediaStream();

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || recorderMimeTypeRef.current || 'audio/webm',
        });
        audioChunksRef.current = [];

        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          setRecordingSeconds(0);
          recordingSecondsRef.current = 0;
          return;
        }

        if (audioBlob.size > 0) {
          clearPendingVoiceNote();
          setPendingVoiceBlob(audioBlob);
          setPendingVoiceDuration(Math.max(1, durationSnapshot));
          setPendingVoiceUrl(URL.createObjectURL(audioBlob));
        }

        setRecordingSeconds(0);
        recordingSecondsRef.current = 0;
      };

      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      setIsRecordingVoice(true);
      recordingTimerRef.current = window.setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
      }, 1000);

      recorder.start(200);
    } catch (error: any) {
      stopMediaStream();
      toast({
        title: 'Micro indisponible',
        description: error?.message || 'Autorisez l\'accès au microphone puis reessayez.',
        status: 'error',
        duration: 3500,
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      discardRecordingRef.current = true;
      mediaRecorderRef.current.stop();
      return;
    }
    clearPendingVoiceNote();
  };

  const submitPendingVoiceNote = async () => {
    if (!pendingVoiceBlob) return;
    const blob = pendingVoiceBlob;
    const duration = pendingVoiceDuration;
    const mimeHint = blob.type || recorderMimeTypeRef.current;
    clearPendingVoiceNote();
    await sendVoiceNote(blob, duration, mimeHint);
  };

  useEffect(() => {
    clearPendingVoiceNote();
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;
  }, [selectedConversation?._id]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      stopMediaStream();
      if (pendingVoiceUrl) {
        URL.revokeObjectURL(pendingVoiceUrl);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [pendingVoiceUrl]);

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
    <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
      <VStack align="stretch" spacing={5}>
        <Box>
          <Heading size="lg" color={C.text}>Messages</Heading>
          <Text color={C.muted} mt={1}>Discutez en temps réel avec vos contacts</Text>
        </Box>

        <Flex
          h={{ base: 'calc(100vh - 220px)', md: 'calc(100vh - 190px)' }}
          minH="560px"
          bg={C.panel}
          borderRadius="2xl"
          border="1px solid"
          borderColor={C.border}
          overflow="hidden"
          boxShadow="0 20px 50px rgba(0,0,0,0.35)"
        >
        {/* Liste des conversations */}
        <Box
          w={{ base: selectedConversation ? '0' : '100%', md: '350px' }}
          borderRight="1px"
          borderColor={C.border}
          overflowY="auto"
          display={{ base: selectedConversation ? 'none' : 'block', md: 'block' }}
          bg={C.panelElevated}
        >
          <Box p={4} borderBottom="1px" borderColor={C.border} position="sticky" top={0} bg={C.panelElevated} zIndex={1}>
            <Text color={C.text} fontWeight="700" mb={3}>Conversations</Text>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color={C.muted} />
              </InputLeftElement>
              <Input
                placeholder="Rechercher..."
                value={conversationQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setConversationQuery(value);
                  searchFriends(value);
                }}
                bg={C.panel}
                color={C.text}
                borderColor={C.border}
                _placeholder={{ color: C.muted }}
                _focus={{ borderColor: C.primaryBorder, boxShadow: 'none' }}
              />
            </InputGroup>

            <Box mt={3}>
              {(searchingFriends || friendResults.length > 0 || conversationQuery.trim().length >= 2) && (
                <Box
                  mt={0}
                  bg={C.panel}
                  border="1px solid"
                  borderColor={C.border}
                  borderRadius="lg"
                  overflow="hidden"
                  maxH="280px"
                  overflowY="auto"
                >
                  {searchingFriends ? (
                    <Flex py={3} justify="center">
                      <Spinner size="sm" color={C.primary} />
                    </Flex>
                  ) : friendResults.length === 0 ? (
                    <Box px={3} py={3}>
                      <Text fontSize="sm" color={C.muted}>
                        Aucun abonne trouve pour cette recherche.
                      </Text>
                    </Box>
                  ) : (
                    <VStack spacing={0} align="stretch">
                      {friendResults.map((friend) => (
                        <HStack
                          key={friend._id}
                          px={3}
                          py={2}
                          justify="space-between"
                          borderBottom="1px solid"
                          borderColor={C.border}
                        >
                          <HStack spacing={2} minW={0}>
                            <Avatar
                              size="xs"
                              name={friend.displayName || friend.username}
                              src={getAvatarUrl(friend.avatar)}
                            />
                            <Box minW={0}>
                              <Text fontSize="sm" color={C.text} isTruncated>
                                {friend.displayName || friend.username}
                              </Text>
                              <Text fontSize="xs" color={C.muted} isTruncated>
                                @{friend.username}
                              </Text>
                            </Box>
                          </HStack>
                          <Button
                            size="xs"
                            bg={C.primary}
                            color="white"
                            _hover={{ bg: '#6d28d9' }}
                            isLoading={startingConversationId === friend._id}
                            onClick={() => handleStartConversation(friend)}
                          >
                            Message
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {loading ? (
            <Flex justify="center" align="center" h="100%">
              <Spinner size="lg" color={C.primary} />
            </Flex>
          ) : filteredConversations.length === 0 ? (
            <Box p={6} textAlign="center">
              <Text color={C.text} mb={2} fontWeight="600">Aucune conversation</Text>
              <Text fontSize="sm" color={C.muted}>
                Commencez une conversation en visitant le profil d'un utilisateur !
              </Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch">
              {filteredConversations.map((conversation) => (
                <Box
                  key={conversation._id}
                  p={4}
                  cursor="pointer"
                  bg={
                    selectedConversation?._id === conversation._id
                      ? C.primarySoft
                      : 'transparent'
                  }
                  _hover={{ bg: 'rgba(124,58,237,0.09)' }}
                  onClick={() => handleSelectConversation(conversation)}
                  borderBottom="1px"
                  borderColor={C.border}
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
                        <Text fontWeight="semibold" isTruncated color={C.text}>
                          {conversation.otherParticipant.displayName ||
                            conversation.otherParticipant.username}
                        </Text>
                        {conversation.unreadCount > 0 && (
                          <Badge bg={C.primary} color="white" borderRadius="full">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </HStack>
                      {conversation.lastMessage && (
                        <Text fontSize="sm" color={C.muted} isTruncated w="full">
                          {conversation.lastMessage.messageType === 'voice' ? '🎤 Note vocale' : conversation.lastMessage.content}
                        </Text>
                      )}
                      {conversation.lastMessageAt && (
                        <Text fontSize="xs" color={C.muted}>
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
                borderColor={C.border}
                align="center"
                bg={C.panelElevated}
                justify="space-between"
              >
                <HStack spacing={2} flex={1}>
                  <IconButton
                    aria-label="Retour"
                    icon={<ArrowBackIcon />}
                    variant="ghost"
                    color={C.text}
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
                      color={C.text}
                      cursor="pointer"
                      _hover={{ color: '#c4b5fd' }}
                      onClick={() =>
                        navigate(`/profile/${selectedConversation.otherParticipant._id}`)
                      }
                    >
                      {selectedConversation.otherParticipant.displayName ||
                        selectedConversation.otherParticipant.username}
                    </Text>
                    <Text fontSize="xs" color={C.muted}>
                      @{selectedConversation.otherParticipant.username}
                    </Text>
                  </VStack>
                </HStack>
                <IconButton
                  aria-label="Fermer la discussion"
                  icon={<CloseIcon />}
                  variant="ghost"
                  color={C.text}
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  display={{ base: 'none', md: 'flex' }}
                />
              </Flex>

              {/* Messages */}
              <Box
                flex={1}
                overflowY="auto"
                p={4}
                bg={C.panel}
                backgroundImage="radial-gradient(circle at 20% 10%, rgba(124,58,237,0.10), transparent 35%), radial-gradient(circle at 85% 90%, rgba(6,182,212,0.08), transparent 35%)"
              >
                {loading ? (
                  <Flex justify="center" align="center" h="100%">
                    <Spinner size="lg" color={C.primary} />
                  </Flex>
                ) : messages.length === 0 ? (
                  <Flex justify="center" align="center" h="100%">
                    <Text color={C.muted}>Aucun message pour le moment</Text>
                  </Flex>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {messages.map((message) => {
                      const isOwn = message.sender._id === user?._id;
                      const currentUserLiked = message.likedBy?.some((l) => l.user === user?._id);
                      const likesCount = message.likedBy?.length || 0;
                      return (
                        <Flex
                          key={message._id}
                          justify={isOwn ? 'flex-end' : 'flex-start'}
                          position="relative"
                          role="group"
                        >
                          <Flex gap={2} align="flex-end" direction={isOwn ? 'row-reverse' : 'row'}>
                            <Box
                              maxW={{ base: '85%', md: '70%' }}
                              minW="170px"
                              width="fit-content"
                              display="block"
                              bg={isOwn ? C.primary : C.panelElevated}
                              color={isOwn ? 'white' : C.text}
                              px={4}
                              py={2}
                              borderRadius="2xl"
                              border={isOwn ? 'none' : '1px solid'}
                              borderColor={isOwn ? 'transparent' : C.border}
                              shadow="sm"
                              whiteSpace="pre-wrap"
                              onDoubleClick={async () => {
                                try {
                                  await api.post(`/messages/messages/${message._id}/like`);
                                  // Optimistic UI: toggle locally
                                  setMessages((prev) =>
                                    prev.map((m) => {
                                      if (m._id !== message._id) return m;
                                      const likedBy = Array.isArray(m.likedBy) ? [...m.likedBy] : [];
                                      const idx = likedBy.findIndex((l) => l.user === user?._id);
                                      if (idx === -1) {
                                        likedBy.push({ user: user?._id!, likedAt: new Date().toISOString() });
                                      } else {
                                        likedBy.splice(idx, 1);
                                      }
                                      return { ...m, likedBy };
                                    })
                                  );
                                } catch (error) {
                                  console.error('Erreur like:', error);
                                }
                              }}
                            >
                              {message.messageType === 'voice' && message.audioUrl ? (
                                <Box
                                  minW={{ base: '220px', md: '260px' }}
                                  maxW="100%"
                                  bg={isOwn ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.18)'}
                                  border="1px solid"
                                  borderColor={isOwn ? 'rgba(255,255,255,0.16)' : C.border}
                                  borderRadius="xl"
                                  p={2}
                                >
                                  <audio controls style={{ width: '100%', display: 'block' }} preload="metadata">
                                    <source src={getMediaUrl(message.audioUrl)} type={message.audioMimeType || 'audio/webm'} />
                                    <source src={getMediaUrl(message.audioUrl)} type="audio/mp4" />
                                    <source src={getMediaUrl(message.audioUrl)} type="audio/ogg" />
                                    Votre navigateur ne supporte pas la lecture audio.
                                  </audio>
                                  <Text
                                    fontSize="xs"
                                    color={isOwn ? 'rgba(255,255,255,0.8)' : C.muted}
                                    mt={1}
                                  >
                                    {`Note vocale${message.audioDuration ? ` • ${formatRecordingTime(message.audioDuration)}` : ''}`}
                                  </Text>
                                </Box>
                              ) : (
                                <Text whiteSpace="pre-wrap" wordBreak="break-word" overflowWrap="anywhere" lineHeight="1.5">
                                  {message.content}
                                </Text>
                              )}
                              <Text
                                fontSize="xs"
                                color={isOwn ? 'rgba(255,255,255,0.75)' : C.muted}
                                textAlign="right"
                                mt={1}
                              >
                                {formatMessageTime(message.createdAt)}
                              </Text>
                              {message.read && (
                                <Badge
                                  mt={1}
                                  ml="auto"
                                  bg="rgba(16,185,129,0.2)"
                                  color="#34d399"
                                  variant="subtle"
                                  borderRadius="full"
                                  px={2}
                                  fontSize="xs"
                                >
                                  Lu
                                </Badge>
                              )}
                              {/* Like indicator */}
                              <Flex mt={1} justify="flex-end" align="center" gap={2}>
                                {likesCount > 0 && (
                                  <Badge
                                    bg={currentUserLiked ? 'rgba(244,114,182,0.2)' : 'rgba(148,163,184,0.2)'}
                                    color={currentUserLiked ? '#f9a8d4' : '#cbd5e1'}
                                    borderRadius="full"
                                  >
                                    ❤️ {likesCount}
                                  </Badge>
                                )}
                              </Flex>
                            </Box>
                            {isOwn && (
                              <Tooltip label="Supprimer le message" hasArrow>
                                <IconButton
                                  aria-label="Supprimer le message"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  color="#fca5a5"
                                  variant="ghost"
                                  opacity={0}
                                  _groupHover={{ opacity: 1, bg: 'rgba(239,68,68,0.14)' }}
                                  transition="opacity 0.2s"
                                  onClick={() => handleDeleteMessage(message._id)}
                                  flexShrink={0}
                                />
                              </Tooltip>
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
              <Box p={4} borderTop="1px" borderColor={C.border} bg={C.panelElevated}>
                {pendingVoiceUrl && (
                  <Box
                    mb={3}
                    p={3}
                    border="1px solid"
                    borderColor={C.primaryBorder}
                    borderRadius="lg"
                    bg={C.panel}
                  >
                    <Text fontSize="xs" color={C.muted} mb={2}>
                      Apercu note vocale ({formatRecordingTime(pendingVoiceDuration)})
                    </Text>
                    <audio controls style={{ width: '100%', display: 'block' }} preload="metadata">
                      <source src={pendingVoiceUrl} type={pendingVoiceBlob?.type || recorderMimeTypeRef.current || 'audio/webm'} />
                      <source src={pendingVoiceUrl} type="audio/mp4" />
                      <source src={pendingVoiceUrl} type="audio/ogg" />
                      Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                    <HStack mt={2} justify="flex-end">
                      <Button size="xs" variant="ghost" color={C.muted} onClick={cancelVoiceRecording}>
                        Annuler
                      </Button>
                      <Button
                        size="xs"
                        bg={C.primary}
                        color="white"
                        _hover={{ bg: '#6d28d9' }}
                        onClick={submitPendingVoiceNote}
                        isLoading={sendingMessage}
                      >
                        Envoyer la note
                      </Button>
                    </HStack>
                  </Box>
                )}
                <form onSubmit={handleSendMessage}>
                  <HStack spacing={2} align="center">
                    <Input
                      placeholder="Écrivez un message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMessage || isRecordingVoice || !!pendingVoiceBlob}
                      bg={C.panel}
                      color={C.text}
                      borderColor={C.border}
                      _placeholder={{ color: C.muted }}
                      _focus={{ borderColor: C.primaryBorder, boxShadow: 'none' }}
                    />
                    <Tooltip
                      label={isRecordingVoice ? `Arreter (${formatRecordingTime(recordingSeconds)})` : 'Enregistrer une note vocale'}
                      hasArrow
                    >
                      <IconButton
                        aria-label={isRecordingVoice ? 'Arreter enregistrement' : 'Enregistrer note vocale'}
                        icon={<Text>{isRecordingVoice ? '⏹️' : '🎤'}</Text>}
                        bg={isRecordingVoice ? '#dc2626' : C.panel}
                        color={isRecordingVoice ? 'white' : C.text}
                        border="1px solid"
                        borderColor={isRecordingVoice ? '#dc2626' : C.border}
                        _hover={{ bg: isRecordingVoice ? '#b91c1c' : C.primarySoft }}
                        size="sm"
                        onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                        isDisabled={sendingMessage || !!pendingVoiceBlob}
                      />
                    </Tooltip>
                    {isRecordingVoice && (
                      <Button
                        size="sm"
                        variant="ghost"
                        color="#fca5a5"
                        onClick={cancelVoiceRecording}
                        isDisabled={sendingMessage}
                      >
                        Annuler
                      </Button>
                    )}
                    <IconButton
                      aria-label="Envoyer"
                      icon={<Text>📤</Text>}
                      bg={C.primary}
                      color="white"
                      _hover={{ bg: '#6d28d9' }}
                      size="sm"
                      type="submit"
                      isLoading={sendingMessage}
                      disabled={!newMessage.trim() || isRecordingVoice || !!pendingVoiceBlob}
                    />
                  </HStack>
                </form>
                {isRecordingVoice && (
                  <Text mt={2} fontSize="xs" color="#fca5a5">
                    Enregistrement en cours... {formatRecordingTime(recordingSeconds)}
                  </Text>
                )}
              </Box>
            </>
          ) : (
            <Flex justify="center" align="center" h="100%">
              <VStack spacing={2}>
                <Text fontSize="4xl">💬</Text>
                <Text color={C.muted}>
                  Sélectionnez une conversation pour commencer
                </Text>
              </VStack>
            </Flex>
          )}
        </Flex>
      </Flex>
      </VStack>
    </Container>
  );
};

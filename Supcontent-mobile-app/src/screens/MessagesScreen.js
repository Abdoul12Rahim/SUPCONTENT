import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { messageAPI, socialAPI, notificationAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import GuestPrompt from '../components/GuestPrompt';

const COLORS = {
  primary: '#7c3aed', primaryLight: 'rgba(124,58,237,0.15)',
  primaryBorder: 'rgba(124,58,237,0.25)', bgDark: '#0d0d14',
  surface: '#13131f', surfaceElevated: '#1a1a2e',
  border: 'rgba(255,255,255,0.06)', textLight: '#f1f5f9',
  textMuted: '#64748b', accentGreen: '#10b981', danger: '#ef4444',
};

const GIFS = [
  { id: 'g1', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', label: 'GG' },
  { id: 'g2', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', label: 'LOL' },
  { id: 'g3', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', label: 'Win' },
  { id: 'g4', url: 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif', label: 'Hype' },
];

const NOTIF_ICONS = {
  follow: { icon: 'person-add', color: '#7c3aed' },
  like: { icon: 'favorite', color: '#ef4444' },
  comment: { icon: 'chat-bubble', color: '#06b6d4' },
  review: { icon: 'star', color: '#facc15' },
  message: { icon: 'chat', color: '#10b981' },
  default: { icon: 'notifications', color: '#64748b' },
};

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useContext(AuthContext);

  // Si pas connecté → GuestPrompt
  if (!isLoggedIn) {
    return (
      <GuestPrompt
        icon="chat-bubble-outline"
        title="Tes messages t'attendent"
        message="Connecte-toi pour envoyer des messages, voir tes notifications et le fil d'activité."
        navigation={navigation}
      />
    );
  }

  const [conversations, setConversations] = useState([]);
  const [myRooms, setMyRooms] = useState([]); // salons rejoints par l'user
  const [feedItems, setFeedItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [showFeed, setShowFeed] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showGifs, setShowGifs] = useState(false);
  const [showDmMenu, setShowDmMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const msgListRef = useRef(null);

  // Recharge à chaque fois qu'on revient sur la page
  useFocusEffect(
    useCallback(() => {
      loadAll();
      return () => {
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }, [])
  );

  // Polling messages toutes les 5s quand chat ouvert
  useEffect(() => {
    if (activeChat) {
      const interval = setInterval(() => {
        loadMessages(activeChat.conversationId, false);
      }, 5000);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (pollingInterval) clearInterval(pollingInterval);
    }
  }, [activeChat?.conversationId]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        messageAPI.getConversations(),
        socialAPI.getFeed(),
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount(),
      ]);

      // Conversations
      if (results[0].status === 'fulfilled') {
        const raw = results[0].value.data;
        const list = Array.isArray(raw) ? raw : raw?.conversations || raw?.data || [];
        setConversations(list);
      }

      // Feed
      if (results[1].status === 'fulfilled') {
        const raw = results[1].value.data;
        const list = Array.isArray(raw) ? raw : raw?.activities || raw?.data || [];
        setFeedItems(list);
      }

      // Notifications
      if (results[2].status === 'fulfilled') {
        const raw = results[2].value.data;
        const list = Array.isArray(raw) ? raw : raw?.notifications || raw?.data || [];
        setNotifications(list);
      }

      // Unread count
      if (results[3].status === 'fulfilled') {
        setNotifUnread(results[3].value.data?.count || 0);
      }
    } catch (e) {
      console.log('Erreur loadAll:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId, showLoader = true) => {
    try {
      const res = await messageAPI.getMessages(conversationId);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : raw?.messages || raw?.data || [];
      setChatMessages(list);
      if (showLoader) {
        setTimeout(() => msgListRef.current?.scrollToEnd({ animated: false }), 100);
      }
    } catch (e) {
      console.log('Erreur loadMessages:', e.message);
    }
  };

  const openConversation = async (conv) => {
    try {
      // Trouve l'autre participant
      const other = conv.participants?.find(p => p._id !== user._id) || conv;
      const convId = conv._id || conv.id;
      setActiveChat({
        conversationId: convId,
        name: other.displayName || other.username || 'Utilisateur',
        avatar: other.avatar || null,
        userId: other._id,
        isSelf: other._id === user._id, // conversation avec soi-même
      });
      await loadMessages(convId);
      await messageAPI.markAsRead(convId);
      // Remet unread à 0
      setConversations(prev =>
        prev.map(c => c._id === convId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (e) {
      console.log('Erreur openConversation:', e.message);
    }
  };

  // Ouvre ou crée une conversation avec soi-même (mode "Notes")
  const openSelfConversation = async () => {
    try {
      const res = await messageAPI.getOrCreateConversation(user._id);
      const conv = res.data;
      const convId = conv._id;
      setActiveChat({
        conversationId: convId,
        name: 'Mes notes',
        avatar: user.avatar || null,
        userId: user._id,
        isSelf: true,
      });
      await loadMessages(convId);
    } catch (e) {
      console.log('Erreur selfConv:', e.message);
      // Fallback si le backend ne supporte pas auto-conversation
      setActiveChat({
        conversationId: 'self',
        name: 'Mes notes',
        avatar: user.avatar || null,
        userId: user._id,
        isSelf: true,
      });
      setChatMessages([]);
    }
  };

  const sendMessage = async (type = 'text', content = null) => {
    const msgContent = content || inputText.trim();
    if (!msgContent) return;
    setIsSending(true);
    try {
      const res = await messageAPI.sendMessage(activeChat.conversationId, {
        content: msgContent,
        type,
      });
      const newMsg = res.data;
      setChatMessages(prev => [...prev, newMsg]);
      setInputText('');
      setShowGifs(false);
      setTimeout(() => msgListRef.current?.scrollToEnd({ animated: true }), 100);
      loadAll(); // refresh liste conversations
    } catch (e) {
      console.log('Erreur sendMessage:', e.message);
      // Fallback local uniquement si erreur réseau
      const fallbackMsg = {
        _id: Date.now().toString(),
        sender: { _id: user._id, username: user.username, avatar: user.avatar },
        content: msgContent,
        type,
        createdAt: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, fallbackMsg]);
      setInputText('');
      setShowGifs(false);
    } finally {
      setIsSending(false);
    }
  };

  const deleteConversation = async (convId) => {
    Alert.alert('Supprimer', 'Supprimer cette conversation ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await messageAPI.deleteConversation(convId);
            setConversations(prev => prev.filter(c => c._id !== convId));
            setShowDmMenu(null);
          } catch (e) {
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        }
      }
    ]);
  };

  const markAllNotifsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setNotifUnread(0);
    } catch (e) { console.log(e); }
  };

  const deleteNotif = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) { console.log(e); }
  };

  const getConvTime = (conv) => {
    const date = conv.lastMessage?.createdAt || conv.updatedAt;
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR');
  };

  const getMsgTime = (msg) => {
    if (!msg.createdAt) return msg.time || '';
    return new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (msg) =>
    msg.sender?._id === user._id || msg.sender?._id === user?._id || msg.senderId === 'me';

  // ── CHAT VIEW ──
  if (activeChat) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
        {/* Header fixé tout en haut */}
        <View style={[styles.chatHeader, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            onPress={() => { setActiveChat(null); setChatMessages([]); }}
            style={styles.navBtn}
          >
            <MaterialIcons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            onPress={() => !activeChat.isSelf && navigation.navigate('Profile', { userId: activeChat.userId })}
          >
            {activeChat.avatar ? (
              <Image source={{ uri: activeChat.avatar }} style={styles.chatAvatar} />
            ) : (
              <View style={[styles.chatAvatar, styles.chatAvatarPlaceholder]}>
                <MaterialIcons
                  name={activeChat.isSelf ? 'bookmark' : 'person'}
                  size={18}
                  color={COLORS.primary}
                />
              </View>
            )}
            <View>
              <Text style={styles.chatName}>{activeChat.name}</Text>
              {activeChat.isSelf && (
                <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>Tes notes privées</Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <MaterialIcons name="more-vert" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={msgListRef}
          data={chatMessages}
          keyExtractor={(item, i) => item._id?.toString() || i.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          onContentSizeChange={() => msgListRef.current?.scrollToEnd({ animated: false })}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <MaterialIcons
                name={activeChat.isSelf ? 'bookmark-border' : 'chat-bubble-outline'}
                size={48}
                color={COLORS.textMuted}
              />
              <Text style={{ color: COLORS.textLight, fontSize: 16, fontWeight: '700', marginTop: 16 }}>
                {activeChat.isSelf ? 'Tes notes' : 'Nouvelle conversation'}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                {activeChat.isSelf
                  ? 'Note tes idées, liens, et rappels ici. Tout est privé.'
                  : 'Envoie le premier message !'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = isMyMessage(item);
            return (
              <View style={[styles.msgRow, mine && styles.msgRowMe]}>
                {!mine && (
                  <TouchableOpacity
                    onPress={() => item.sender?._id && navigation.navigate('Profile', { userId: item.sender._id })}
                  >
                    {item.sender?.avatar ? (
                      <Image source={{ uri: item.sender.avatar }} style={styles.msgAvatar} />
                    ) : (
                      <View style={[styles.msgAvatar, { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                        <MaterialIcons name="person" size={14} color={COLORS.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                <View style={{ maxWidth: '75%' }}>
                  <View style={[styles.msgBubble, mine ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                    {item.type === 'gif' || item.content?.startsWith('https://media.giphy.com') ? (
                      <Image
                        source={{ uri: item.content }}
                        style={{ width: 180, height: 120, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                    ) : item.type === 'voice' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialIcons name="mic" size={18} color={mine ? 'white' : COLORS.primary} />
                        <Text style={{ color: mine ? 'white' : COLORS.textLight, fontSize: 13, fontStyle: 'italic' }}>
                          Message vocal
                        </Text>
                        <MaterialIcons name="play-arrow" size={20} color={mine ? 'white' : COLORS.primary} />
                      </View>
                    ) : (
                      <Text style={{ color: mine ? 'white' : COLORS.textLight, fontSize: 14, lineHeight: 20 }}>
                        {item.content}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.msgTime, mine && { textAlign: 'right' }]}>
                    {getMsgTime(item)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* GIF picker */}
        {showGifs && (
          <View style={styles.gifPicker}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {GIFS.map(gif => (
                <TouchableOpacity
                  key={gif.id}
                  onPress={() => sendMessage('gif', gif.url)}
                  style={styles.gifThumb}
                >
                  <Image source={{ uri: gif.url }} style={{ width: 80, height: 60, borderRadius: 8 }} />
                  <Text style={styles.gifLabel}>{gif.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input — KeyboardAvoidingView avec offset pour la navbar flottante */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[
            styles.inputRow,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              // Ajoute de l'espace pour la navbar flottante
              marginBottom: insets.bottom > 0 ? 0 : 60,
            }
          ]}>
            <TouchableOpacity onPress={() => setShowGifs(!showGifs)} style={styles.inputAction}>
              <Text style={{ fontSize: 22 }}>😄</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sendMessage('voice', 'vocal')} style={styles.inputAction}>
              <MaterialIcons name="mic" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              placeholder={activeChat.isSelf ? 'Note quelque chose...' : 'Message...'}
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              onPress={() => sendMessage('text')}
              style={[styles.sendBtn, { opacity: (inputText.trim() && !isSending) ? 1 : 0.4 }]}
              disabled={!inputText.trim() || isSending}
            >
              {isSending
                ? <ActivityIndicator size="small" color="white" />
                : <MaterialIcons name="send" size={20} color="white" />
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── MAIN LIST ──
  const feedUnread = feedItems.filter(f => !f.isRead).length;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
      <View style={[styles.listHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.listTitle}>Messages</Text>
        <TouchableOpacity onPress={loadAll} style={{ padding: 8 }}>
          <MaterialIcons name="refresh" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SALONS REJOINTS ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>MES SALONS</Text>
          {myRooms.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyRoomsRow}
              onPress={() => navigation.navigate('Rooms')}
            >
              <MaterialIcons name="people-outline" size={20} color={COLORS.textMuted} />
              <Text style={{ color: COLORS.textMuted, fontSize: 13, marginLeft: 10 }}>
                Rejoins des salons pour les voir ici
              </Text>
              <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
            >
              {myRooms.map(room => (
                <TouchableOpacity
                  key={room._id || room.id}
                  style={styles.roomStory}
                  onPress={() => navigation.navigate('Rooms', { roomId: room._id || room.id })}
                >
                  <View style={styles.roomStoryRing}>
                    <Image
                      source={{ uri: room.image || 'https://via.placeholder.com/56' }}
                      style={styles.roomStoryAvatar}
                    />
                    {(room.unread || 0) > 0 && (
                      <View style={styles.storyBadge}>
                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '700' }}>{room.unread}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.roomStoryName} numberOfLines={1}>{room.game}</Text>
                  <Text style={styles.roomStoryLast} numberOfLines={1}>{room.lastMessage || ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── MES NOTES (conversation avec soi-même) ── */}
        <TouchableOpacity style={styles.bubbleRow} onPress={openSelfConversation}>
          <View style={[styles.bubbleIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <MaterialIcons name="bookmark" size={24} color={COLORS.accentGreen} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bubbleName}>Mes notes</Text>
            <Text style={styles.bubblePreview}>Idées, liens, rappels — privé</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* ── FIL D'ACTIVITÉ ── */}
        <TouchableOpacity style={styles.bubbleRow} onPress={() => setShowFeed(true)}>
          <View style={styles.bubbleIcon}>
            <MaterialIcons name="dynamic-feed" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bubbleName}>Fil d'activité</Text>
            {feedItems.length > 0 ? (
              <Text style={styles.bubblePreview} numberOfLines={1}>
                {feedItems[0]?.user?.username} · {feedItems[0]?.description || 'Nouvelle activité'}
              </Text>
            ) : (
              <Text style={styles.bubblePreview}>Activité de ceux que tu suis</Text>
            )}
          </View>
          {feedUnread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{feedUnread > 99 ? '99+' : feedUnread}</Text>
            </View>
          )}
          <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* ── NOTIFICATIONS ── */}
        <TouchableOpacity style={styles.bubbleRow} onPress={() => setShowNotifs(true)}>
          <View style={[styles.bubbleIcon, { backgroundColor: 'rgba(250,204,21,0.1)' }]}>
            <MaterialIcons name="notifications" size={24} color="#facc15" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bubbleName}>Notifications</Text>
            {notifications.length > 0 ? (
              <Text style={styles.bubblePreview} numberOfLines={1}>
                {notifications[0]?.sender?.username} · {notifications[0]?.message || 'Nouvelle notification'}
              </Text>
            ) : (
              <Text style={styles.bubblePreview}>Abonnements, likes, commentaires</Text>
            )}
          </View>
          {notifUnread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: '#facc15' }]}>
              <Text style={[styles.unreadText, { color: '#0d0d14' }]}>
                {notifUnread > 99 ? '99+' : notifUnread}
              </Text>
            </View>
          )}
          <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* ── MESSAGES PRIVÉS ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>MESSAGES PRIVÉS</Text>
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} />
          ) : conversations.length === 0 ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <MaterialIcons name="chat-bubble-outline" size={40} color={COLORS.textMuted} />
              <Text style={{ color: COLORS.textLight, fontSize: 15, fontWeight: '700', marginTop: 14 }}>
                Aucun message privé
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                Va sur le profil d'un joueur pour lui envoyer un message.
              </Text>
            </View>
          ) : conversations.map(conv => {
            const otherUser = conv.participants?.find(p => p._id !== user._id) || {};
            const convUnread = conv.unreadCount || 0;
            const convId = conv._id;
            const isSelf = conv.participants?.every(p => p._id === user._id);

            return (
              <View key={convId}>
                <TouchableOpacity
                  style={styles.convRow}
                  onPress={() => openConversation(conv)}
                  activeOpacity={0.8}
                >
                  <View style={{ position: 'relative' }}>
                    {otherUser.avatar ? (
                      <Image source={{ uri: otherUser.avatar }} style={styles.convAvatar} />
                    ) : (
                      <View style={[styles.convAvatar, { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                        <MaterialIcons
                          name={isSelf ? 'bookmark' : 'person'}
                          size={22}
                          color={COLORS.primary}
                        />
                      </View>
                    )}
                    <View style={styles.onlineDot} />
                  </View>

                  <View style={styles.convContent}>
                    <View style={styles.convTop}>
                      <Text style={[styles.convName, convUnread > 0 && { color: 'white', fontWeight: '800' }]}>
                        {isSelf ? 'Mes notes' : (otherUser.displayName || otherUser.username || 'Utilisateur')}
                      </Text>
                      <Text style={styles.convTime}>{getConvTime(conv)}</Text>
                    </View>
                    <View style={styles.convBottom}>
                      <Text style={[styles.convLast, convUnread > 0 && { color: COLORS.textLight }]} numberOfLines={1}>
                        {conv.lastMessage?.content || 'Démarrer la conversation'}
                      </Text>
                      {convUnread > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{convUnread}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowDmMenu(showDmMenu === convId ? null : convId)}
                    style={{ padding: 8 }}
                  >
                    <MaterialIcons name="more-vert" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Quick menu */}
                {showDmMenu === convId && (
                  <View style={styles.dmQuickMenu}>
                    {!isSelf && (
                      <TouchableOpacity
                        style={styles.dmMenuItem}
                        onPress={() => { navigation.navigate('Profile', { userId: otherUser._id }); setShowDmMenu(null); }}
                      >
                        <MaterialIcons name="person" size={18} color={COLORS.textLight} />
                        <Text style={styles.dmMenuText}>Voir le profil</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.dmMenuItem}
                      onPress={() => deleteConversation(convId)}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={COLORS.danger} />
                      <Text style={[styles.dmMenuText, { color: COLORS.danger }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 76 }} />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── FEED MODAL ── */}
      <Modal visible={showFeed} animationType="slide">
        <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setShowFeed(false)} style={styles.navBtn}>
              <MaterialIcons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Fil d'activité</Text>
            <View style={{ width: 38 }} />
          </View>
          <FlatList
            data={feedItems}
            keyExtractor={(item, i) => item._id || i.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: 60 }}>
                <MaterialIcons name="dynamic-feed" size={48} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textLight, fontSize: 16, fontWeight: '700', marginTop: 14 }}>
                  Aucune activité
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                  Suis des joueurs pour voir leur activité ici
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.feedCard}
                onPress={() => {
                  setShowFeed(false);
                  if (item.contentId || item.content?._id) {
                    navigation.navigate('GameDetail', { id: item.contentId || item.content._id });
                  }
                }}
              >
                <TouchableOpacity onPress={() => { setShowFeed(false); navigation.navigate('Profile', { userId: item.user?._id }); }}>
                  {item.user?.avatar ? (
                    <Image source={{ uri: item.user.avatar }} style={styles.feedAvatar} />
                  ) : (
                    <View style={[styles.feedAvatar, { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialIcons name="person" size={18} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, lineHeight: 19 }}>
                    <Text style={{ color: COLORS.textLight, fontWeight: '700' }}>{item.user?.username} </Text>
                    <Text style={{ color: COLORS.textMuted }}>{item.description || item.action}</Text>
                  </Text>
                  {item.content?.title && (
                    <Text style={{ color: COLORS.primary, fontSize: 13, marginTop: 4, fontWeight: '600' }}>
                      {item.content.title}
                    </Text>
                  )}
                  <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 5 }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : ''}
                  </Text>
                </View>
                {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: COLORS.primary }]} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* ── NOTIFICATIONS MODAL ── */}
      <Modal visible={showNotifs} animationType="slide">
        <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setShowNotifs(false)} style={styles.navBtn}>
              <MaterialIcons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Notifications</Text>
            {notifUnread > 0 && (
              <TouchableOpacity onPress={markAllNotifsRead} style={styles.readAllBtn}>
                <Text style={styles.readAllText}>Tout lire</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(item, i) => item._id || i.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: 60 }}>
                <MaterialIcons name="notifications-none" size={48} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textLight, fontSize: 16, fontWeight: '700', marginTop: 14 }}>
                  Aucune notification
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 70 }} />
            )}
            renderItem={({ item }) => {
              const typeInfo = NOTIF_ICONS[item.type] || NOTIF_ICONS.default;
              return (
                <TouchableOpacity
                  style={[styles.notifRow, !item.isRead && styles.notifUnread]}
                  onPress={() => {
                    if (!item.isRead) {
                      notificationAPI.markAsRead(item._id).catch(() => {});
                      setNotifications(prev => prev.map(n => n._id === item._id ? { ...n, isRead: true } : n));
                      setNotifUnread(prev => Math.max(0, prev - 1));
                    }
                    if (item.type === 'follow') {
                      setShowNotifs(false);
                      navigation.navigate('Profile', { userId: item.sender?._id });
                    } else if (item.relatedContent) {
                      setShowNotifs(false);
                      navigation.navigate('GameDetail', { id: item.relatedContent });
                    }
                  }}
                >
                  <View style={[styles.notifIconWrap, { backgroundColor: `${typeInfo.color}20` }]}>
                    <MaterialIcons name={typeInfo.icon} size={20} color={typeInfo.color} />
                  </View>
                  {item.sender?.avatar && (
                    <Image source={{ uri: item.sender.avatar }} style={styles.notifAvatar} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, lineHeight: 19 }}>
                      <Text style={{ fontWeight: '700', color: COLORS.textLight }}>
                        {item.sender?.username}{' '}
                      </Text>
                      <Text style={{ color: COLORS.textMuted }}>{item.message}</Text>
                    </Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 3 }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : ''}
                    </Text>
                  </View>
                  {!item.isRead && <View style={styles.unreadDot} />}
                  <TouchableOpacity onPress={() => deleteNotif(item._id)} style={{ padding: 8 }}>
                    <MaterialIcons name="close" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  listTitle: { color: COLORS.textLight, fontSize: 24, fontWeight: '800' },
  sectionBlock: { paddingTop: 4 },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, paddingVertical: 12 },
  divider: { height: 8, backgroundColor: COLORS.surface },
  emptyRoomsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  // Rooms stories
  roomStory: { alignItems: 'center', marginRight: 16, width: 68 },
  roomStoryRing: { position: 'relative', marginBottom: 6 },
  roomStoryAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: COLORS.primary },
  storyBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.danger, borderRadius: 9, paddingHorizontal: 5, paddingVertical: 2, minWidth: 18, alignItems: 'center', borderWidth: 2, borderColor: COLORS.bgDark },
  roomStoryName: { color: COLORS.textLight, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  roomStoryLast: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  // Bubble rows (Feed, Notifs, Notes)
  bubbleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  bubbleIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder },
  bubbleName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  bubblePreview: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  // DMs
  convRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  convAvatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  onlineDot: { position: 'absolute', bottom: 2, right: 14, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accentGreen, borderWidth: 2, borderColor: COLORS.bgDark },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convName: { color: COLORS.textLight, fontWeight: '600', fontSize: 15 },
  convTime: { color: COLORS.textMuted, fontSize: 12 },
  convBottom: { flexDirection: 'row', alignItems: 'center' },
  convLast: { color: COLORS.textMuted, fontSize: 13, flex: 1, marginRight: 8 },
  unreadBadge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 22, alignItems: 'center' },
  unreadText: { color: 'white', fontSize: 11, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  dmQuickMenu: { marginLeft: 76, marginRight: 16, backgroundColor: COLORS.surfaceElevated, borderRadius: 12, padding: 4, marginBottom: 4, borderWidth: 1, borderColor: COLORS.border },
  dmMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8 },
  dmMenuText: { color: COLORS.textLight, fontSize: 14, fontWeight: '500' },
  // Chat
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  chatAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  chatAvatarPlaceholder: { backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primaryBorder, justifyContent: 'center', alignItems: 'center' },
  chatName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  navBtn: { padding: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  msgBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  msgBubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  msgTime: { color: COLORS.textMuted, fontSize: 10, marginTop: 4, marginHorizontal: 4 },
  gifPicker: { backgroundColor: COLORS.surface, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  gifThumb: { alignItems: 'center', marginRight: 10 },
  gifLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  inputAction: { padding: 6, marginRight: 4 },
  chatInput: { flex: 1, backgroundColor: COLORS.bgDark, color: COLORS.textLight, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, maxHeight: 100 },
  sendBtn: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  // Modals
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  modalHeaderTitle: { color: COLORS.textLight, fontSize: 18, fontWeight: '700' },
  readAllBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primaryBorder },
  readAllText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
  // Feed
  feedCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  feedAvatar: { width: 40, height: 40, borderRadius: 20 },
  // Notifs
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  notifUnread: { backgroundColor: 'rgba(124,58,237,0.05)' },
  notifIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  notifAvatar: { width: 32, height: 32, borderRadius: 16 },
});
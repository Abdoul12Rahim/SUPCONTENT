import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messageAPI, socialAPI, notificationAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const COLORS = {
  primary: '#7c3aed', primaryLight: 'rgba(124,58,237,0.15)',
  primaryBorder: 'rgba(124,58,237,0.25)', bgDark: '#0d0d14',
  surface: '#13131f', surfaceElevated: '#1a1a2e',
  border: 'rgba(255,255,255,0.06)', textLight: '#f1f5f9',
  textMuted: '#64748b', accentGreen: '#10b981', danger: '#ef4444',
};

const CURRENT_USER = { id: 'me', name: 'Moi', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' };

const MOCK_ROOMS = [
  { id: 'r1', game: 'GTA VI', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80', lastMessage: 'Session ce soir ?', lastTime: '14:05', unread: 3 },
  { id: 'r2', game: 'Elden Ring', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&q=80', lastMessage: 'Malenia nerfée 😤', lastTime: '10:00', unread: 0 },
  { id: 'r3', game: 'Valorant', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80', lastMessage: 'Ranking 20h !', lastTime: '12:30', unread: 1 },
];

const GIFS = [
  { id: 'g1', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', label: 'GG' },
  { id: 'g2', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', label: 'LOL' },
  { id: 'g3', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', label: 'Win' },
];

const NOTIF_ICONS = {
  follow: { icon: 'person-add', color: '#7c3aed' },
  like: { icon: 'favorite', color: '#ef4444' },
  comment: { icon: 'chat-bubble', color: '#06b6d4' },
  review: { icon: 'star', color: '#facc15' },
  default: { icon: 'notifications', color: '#64748b' },
};

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = React.useContext(AuthContext);

  const [dms, setDms] = useState([]);
  const [rooms] = useState(MOCK_ROOMS);
  const [feedItems, setFeedItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [feedUnread, setFeedUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const [dmUnread, setDmUnread] = useState(0);

  const [activeChat, setActiveChat] = useState(null);
  const [showFeed, setShowFeed] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showGifs, setShowGifs] = useState(false);
  const [showDmMenu, setShowDmMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const msgListRef = useRef(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [convsRes, feedRes, notifRes, unreadRes] = await Promise.allSettled([
        messageAPI.getConversations(),
        socialAPI.getFeed(),
        notificationAPI.getAll(),
        messageAPI.getUnreadCount(),
      ]);
      if (convsRes.status === 'fulfilled') setDms(convsRes.value.data || []);
      if (feedRes.status === 'fulfilled') {
        const items = feedRes.value.data || [];
        setFeedItems(items);
        setFeedUnread(items.filter(f => !f.isRead).length);
      }
      if (notifRes.status === 'fulfilled') {
        const notifs = notifRes.value.data || [];
        setNotifications(notifs);
        setNotifUnread(notifs.filter(n => !n.isRead).length);
      }
      if (unreadRes.status === 'fulfilled') setDmUnread(unreadRes.value.data?.count || 0);
    } catch (e) { console.log(e); } finally { setIsLoading(false); }
  };

  const openConversation = async (dm) => {
    try {
      const convId = dm._id || dm.id;
      const msgRes = await messageAPI.getMessages(convId);
      await messageAPI.markAsRead(convId);
      setActiveChat({ ...dm, conversationId: convId, messages: msgRes.data || [] });
      setDms(prev => prev.map(d => d._id === convId ? { ...d, unreadCount: 0 } : d));
    } catch (e) {
      // fallback mock
      setActiveChat({ ...dm, conversationId: dm.id, messages: dm.messages || [] });
    }
  };

  const sendMessage = async (type, content) => {
    if (type === 'text' && !content.trim()) return;
    try {
      const res = await messageAPI.sendMessage(activeChat.conversationId, { content, type });
      const msg = res.data;
      setActiveChat(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    } catch {
      // fallback local
      const msg = { _id: Date.now().toString(), senderId: 'me', content, type, createdAt: new Date().toISOString() };
      setActiveChat(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    }
    setInputText('');
    setShowGifs(false);
    setTimeout(() => msgListRef.current?.scrollToEnd({ animated: true }), 100);
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

  // ── ACTIVE CHAT ──
  if (activeChat) {
    const messages = activeChat.messages || [];
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
        <View style={[styles.chatHeader, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={() => setActiveChat(null)} style={styles.navBtn}>
            <MaterialIcons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            onPress={() => navigation.navigate('Profile', { userId: activeChat._id || activeChat.id })}
          >
            <Image source={{ uri: activeChat.image || activeChat.avatar || activeChat.participants?.[0]?.avatar }} style={styles.chatAvatar} />
            <View>
              <Text style={styles.chatName}>{activeChat.game || activeChat.name || activeChat.participants?.[0]?.username}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <MaterialIcons name="more-vert" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={msgListRef}
          data={messages}
          keyExtractor={item => item._id || item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
          onContentSizeChange={() => msgListRef.current?.scrollToEnd({ animated: false })}
          style={{ flex: 1 }}
          renderItem={({ item }) => {
            const isMe = item.senderId === 'me' || item.sender?._id === user?._id;
            const avatar = item.sender?.avatar || activeChat.avatar;
            return (
              <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && (
                  <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.sender?._id })}>
                    <Image source={{ uri: avatar }} style={styles.msgAvatar} />
                  </TouchableOpacity>
                )}
                <View style={{ maxWidth: '75%' }}>
                  <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                    {item.type === 'gif' ? (
                      <Image source={{ uri: item.content }} style={{ width: 180, height: 120, borderRadius: 12 }} resizeMode="cover" />
                    ) : item.type === 'voice' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialIcons name="mic" size={18} color={isMe ? 'white' : COLORS.primary} />
                        <Text style={{ color: isMe ? 'white' : COLORS.textLight, fontSize: 13, fontStyle: 'italic' }}>Message vocal</Text>
                        <MaterialIcons name="play-arrow" size={20} color={isMe ? 'white' : COLORS.primary} />
                      </View>
                    ) : (
                      <Text style={{ color: isMe ? 'white' : COLORS.textLight, fontSize: 14, lineHeight: 20 }}>{item.content}</Text>
                    )}
                  </View>
                  <Text style={[styles.msgTime, isMe && { textAlign: 'right' }]}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : item.time}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {showGifs && (
          <View style={{ backgroundColor: COLORS.surface, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {GIFS.map(gif => (
                <TouchableOpacity key={gif.id} onPress={() => sendMessage('gif', gif.url)} style={{ alignItems: 'center', marginRight: 10 }}>
                  <Image source={{ uri: gif.url }} style={{ width: 80, height: 60, borderRadius: 8 }} />
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 4 }}>{gif.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.inputRow, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
            <TouchableOpacity onPress={() => setShowGifs(!showGifs)} style={{ padding: 6, marginRight: 4 }}>
              <Text style={{ fontSize: 22 }}>😄</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => sendMessage('voice', 'vocal')} style={{ padding: 6, marginRight: 4 }}>
              <MaterialIcons name="mic" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              placeholder="Message..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              onPress={() => sendMessage('text', inputText)}
              style={[styles.sendBtn, { opacity: inputText.trim() ? 1 : 0.4 }]}
              disabled={!inputText.trim()}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── MAIN LIST ──
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
      <View style={[styles.listHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.listTitle}>Messages</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ── SALONS ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>MES SALONS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            {rooms.map(room => (
              <TouchableOpacity key={room.id} style={styles.roomStory} onPress={() => navigation.navigate('Rooms', { roomId: room.id })}>
                <View style={styles.roomStoryRing}>
                  <Image source={{ uri: room.image }} style={styles.roomStoryAvatar} />
                  {room.unread > 0 && (
                    <View style={styles.storyBadge}>
                      <Text style={{ color: 'white', fontSize: 9, fontWeight: '700' }}>{room.unread}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.roomStoryName} numberOfLines={1}>{room.game}</Text>
                <Text style={styles.roomStoryLast} numberOfLines={1}>{room.lastMessage}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* ── FEED ── */}
        <TouchableOpacity style={styles.bubbleRow} onPress={() => setShowFeed(true)}>
          <View style={styles.bubbleIcon}>
            <MaterialIcons name="dynamic-feed" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bubbleName}>Fil d'activité</Text>
            {feedItems.length > 0 && (
              <Text style={styles.bubblePreview} numberOfLines={1}>
                {feedItems[0]?.user?.username} · {feedItems[0]?.description || 'Nouvelle activité'}
              </Text>
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
            {notifications.length > 0 && (
              <Text style={styles.bubblePreview} numberOfLines={1}>
                {notifications[0]?.sender?.username} · {notifications[0]?.message || 'Nouvelle notification'}
              </Text>
            )}
          </View>
          {notifUnread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: '#facc15' }]}>
              <Text style={[styles.unreadText, { color: '#0d0d14' }]}>{notifUnread > 99 ? '99+' : notifUnread}</Text>
            </View>
          )}
          <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* ── DMs ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>MESSAGES PRIVÉS</Text>
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} />
          ) : dms.length === 0 ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <MaterialIcons name="chat-bubble-outline" size={36} color={COLORS.textMuted} />
              <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 14 }}>Aucun message privé</Text>
            </View>
          ) : dms.map(dm => {
            const otherUser = dm.participants?.find(p => p._id !== user?._id) || dm;
            const convUnread = dm.unreadCount || dm.unread || 0;
            return (
              <View key={dm._id || dm.id}>
                <TouchableOpacity style={styles.convRow} onPress={() => openConversation(dm)}>
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: otherUser.avatar || dm.avatar || 'https://via.placeholder.com/50' }} style={styles.convAvatar} />
                    <View style={styles.onlineDot} />
                  </View>
                  <View style={styles.convContent}>
                    <View style={styles.convTop}>
                      <Text style={styles.convName}>{otherUser.username || dm.name}</Text>
                      <Text style={styles.convTime}>
                        {dm.lastMessage?.createdAt
                          ? new Date(dm.lastMessage.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                          : dm.lastTime || ''}
                      </Text>
                    </View>
                    <View style={styles.convBottom}>
                      <Text style={styles.convLast} numberOfLines={1}>
                        {dm.lastMessage?.content || dm.lastMessage || 'Démarrer la conversation'}
                      </Text>
                      {convUnread > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{convUnread}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setShowDmMenu(showDmMenu === (dm._id || dm.id) ? null : (dm._id || dm.id))} style={{ padding: 8 }}>
                    <MaterialIcons name="more-vert" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
                {showDmMenu === (dm._id || dm.id) && (
                  <View style={styles.dmQuickMenu}>
                    <TouchableOpacity style={styles.dmMenuItem} onPress={() => { navigation.navigate('Profile', { userId: otherUser._id }); setShowDmMenu(null); }}>
                      <MaterialIcons name="person" size={18} color={COLORS.textLight} />
                      <Text style={styles.dmMenuText}>Voir le profil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dmMenuItem} onPress={() => {
                      Alert.alert('Bloquer', 'Bloquer cet utilisateur ?', [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Bloquer', style: 'destructive', onPress: () => { setDms(prev => prev.filter(d => (d._id || d.id) !== (dm._id || dm.id))); setShowDmMenu(null); } }
                      ]);
                    }}>
                      <MaterialIcons name="block" size={18} color={COLORS.danger} />
                      <Text style={[styles.dmMenuText, { color: COLORS.danger }]}>Bloquer</Text>
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
                <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Aucune activité pour l'instant</Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>Suis des joueurs pour voir leur activité ici</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.feedCard}
                onPress={() => { setShowFeed(false); if (item.contentId) navigation.navigate('GameDetail', { id: item.contentId }); }}
              >
                <TouchableOpacity onPress={() => { setShowFeed(false); navigation.navigate('Profile', { userId: item.user?._id }); }}>
                  <Image source={{ uri: item.user?.avatar || 'https://via.placeholder.com/40' }} style={styles.feedAvatar} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedText}>
                    <Text style={{ color: COLORS.textLight, fontWeight: '700' }}>{item.user?.username} </Text>
                    <Text style={{ color: COLORS.textMuted }}>{item.description || item.action}</Text>
                  </Text>
                  {item.content?.title && (
                    <Text style={{ color: COLORS.primary, fontSize: 13, marginTop: 4, fontWeight: '600' }}>{item.content.title}</Text>
                  )}
                  <Text style={styles.feedTime}>
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
                <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Aucune notification</Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 70 }} />}
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
                    if (item.type === 'follow') { setShowNotifs(false); navigation.navigate('Profile', { userId: item.sender?._id }); }
                    else if (item.relatedContent) { setShowNotifs(false); navigation.navigate('GameDetail', { id: item.relatedContent }); }
                  }}
                >
                  <View style={[styles.notifIconWrap, { backgroundColor: `${typeInfo.color}20` }]}>
                    <MaterialIcons name={typeInfo.icon} size={20} color={typeInfo.color} />
                  </View>
                  {item.sender?.avatar && <Image source={{ uri: item.sender.avatar }} style={styles.notifAvatar} />}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, lineHeight: 19 }}>
                      <Text style={{ fontWeight: '700', color: COLORS.textLight }}>{item.sender?.username} </Text>
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
  listHeader: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  listTitle: { color: COLORS.textLight, fontSize: 24, fontWeight: '800' },
  sectionBlock: { paddingTop: 4 },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, paddingVertical: 12 },
  divider: { height: 8, backgroundColor: COLORS.surface },
  roomStory: { alignItems: 'center', marginRight: 16, width: 68 },
  roomStoryRing: { position: 'relative', marginBottom: 6 },
  roomStoryAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: COLORS.primary },
  storyBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.danger, borderRadius: 9, paddingHorizontal: 5, paddingVertical: 2, minWidth: 18, alignItems: 'center', borderWidth: 2, borderColor: COLORS.bgDark },
  roomStoryName: { color: COLORS.textLight, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  roomStoryLast: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  // Feed + Notif bubble rows
  bubbleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  bubbleIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder },
  bubbleName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  bubblePreview: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  // DMs
  convRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  convAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 14 },
  onlineDot: { position: 'absolute', bottom: 2, right: 14, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accentGreen, borderWidth: 2, borderColor: COLORS.bgDark },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
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
  chatAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1, borderColor: COLORS.primaryBorder },
  chatName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  navBtn: { padding: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  msgBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  msgBubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  msgTime: { color: COLORS.textMuted, fontSize: 10, marginTop: 4, marginHorizontal: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
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
  feedText: { fontSize: 13, lineHeight: 19 },
  feedTime: { color: COLORS.textMuted, fontSize: 11, marginTop: 5 },
  // Notifs
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  notifUnread: { backgroundColor: 'rgba(124,58,237,0.05)' },
  notifIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  notifAvatar: { width: 32, height: 32, borderRadius: 16 },
});
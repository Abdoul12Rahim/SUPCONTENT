import React, { useState, useContext, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal, TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { messageAPI, socialAPI, notificationAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import GuestPrompt from '../components/GuestPrompt';

const COLORS = {
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

const NOTIF_ICONS = {
  follow: { icon: 'person-add', color: '#7c3aed' },
  like: { icon: 'favorite', color: '#ef4444' },
  comment: { icon: 'chat-bubble', color: '#06b6d4' },
  review: { icon: 'star', color: '#facc15' },
  message: { icon: 'chat', color: '#10b981' },
  default: { icon: 'notifications', color: '#64748b' }
};

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useContext(AuthContext);

  const [conversations, setConversations] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [showDmMenu, setShowDmMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- NOUVEAUX ÉTATS POUR LA RECHERCHE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState({
    notes: true,
    feed: true,
    notifs: true,
    dms: true,
  });
  
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showNotifsModal, setShowNotifsModal] = useState(false);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        messageAPI.getConversations(),
        socialAPI.getFeed(),
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount(),
      ]);

      if (results[0].status === 'fulfilled') {
        const raw = results[0].value.data;
        const list = Array.isArray(raw) ? raw : raw?.conversations || raw?.data || [];
        setConversations(list);
      }
      if (results[1].status === 'fulfilled') {
        const raw = results[1].value.data;
        const list = Array.isArray(raw) ? raw : raw?.activities || raw?.data || [];
        setFeedItems(list);
      }
      if (results[2].status === 'fulfilled') {
        const raw = results[2].value.data;
        const list = Array.isArray(raw) ? raw : raw?.notifications || raw?.data || [];
        setNotifications(list);
      }
      if (results[3].status === 'fulfilled') {
        setNotifUnread(results[3].value.data?.count || 0);
      }
    } catch (e) {
      console.log('Erreur loadAll:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  // --- FONCTION DE RECHERCHE ---
  const handleSearch = async (text) => {
    setSearchQuery(text);
    
    // On cherche seulement si 2 lettres ou plus sont tapées
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await socialAPI.searchUsers(text); 
      // Adaptation selon ton backend (res.data ou res.data.users)
      const foundUsers = res.data?.users || res.data || [];
      setSearchResults(foundUsers);
    } catch (e) {
      console.log('Erreur recherche utilisateurs:', e.message);
    } finally {
      setIsSearching(false);
    }
  };

  const openConversation = async (conv) => {
    try {
      const other = conv.participants?.find(p => p._id !== user._id) || conv;
      const convId = conv._id || conv.id;
      
      navigation.navigate('Chat', {
        conversationId: convId,
        name: other.displayName || other.username || 'Utilisateur',
        avatar: other.avatar || null,
        userId: other._id,
        isSelf: other._id === user._id,
      });
      
      await messageAPI.markAsRead(convId);
      setConversations(prev =>
        prev.map(c => c._id === convId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (e) {
      console.log('Erreur openConversation:', e.message);
    }
  };

  // Ouverture des notes (sans appeler l'API qui donne erreur 403)
  const openSelfConversation = () => {
    navigation.navigate('Chat', {
      conversationId: 'self',
      name: 'Mes notes',
      avatar: user?.avatar || null,
      userId: user?._id,
      isSelf: true,
    });
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  const feedUnread = feedItems.filter(f => !f.isRead).length;

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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
      
      {/* HEADER AVEC RECHERCHE */}
      <View style={[styles.listHeader, { paddingTop: insets.top + 8, flexDirection: 'column', alignItems: 'stretch' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.listTitle}>Messages</Text>
          <TouchableOpacity onPress={loadAll} style={{ padding: 8 }}>
            <MaterialIcons name="refresh" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        
        {/* Barre de saisie */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Chercher un joueur..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SYSTÈME D'AFFICHAGE CONDITIONNEL */}
      {searchQuery.length > 0 ? (
        
        /* --- MODE RECHERCHE --- */
        <View style={{ flex: 1 }}>
          {isSearching ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : searchResults.length === 0 ? (
            <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 40 }}>
              Aucun joueur trouvé pour "{searchQuery}"
            </Text>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultRow}
                  onPress={() => {
                    setSearchQuery(''); // On vide la recherche après le clic
                    navigation.navigate('Profile', { userId: item._id });
                  }}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.searchAvatar} />
                  ) : (
                    <View style={[styles.searchAvatar, { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialIcons name="person" size={20} color={COLORS.primary} />
                    </View>
                  )}
                  <Text style={styles.searchUsername}>{item.username || item.displayName}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>

      ) : (

        /* --- MODE NORMAL (Messages, Notes, Feed) --- */
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* MES NOTES */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('notes')}>
            <Text style={styles.sectionLabel}>MES NOTES</Text>
            <MaterialIcons name={expandedSections.notes ? "expand-less" : "expand-more"} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          {expandedSections.notes && (
            <TouchableOpacity style={styles.bubbleRow} onPress={openSelfConversation}>
              <View style={[styles.bubbleIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <MaterialIcons name="bookmark" size={24} color={COLORS.accentGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bubbleName}>Mes notes</Text>
                <Text style={styles.bubblePreview}>Idées, liens, rappels - privé</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          <View style={styles.divider} />

          {/* FIL D'ACTIVITÉ */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('feed')}>
            <Text style={styles.sectionLabel}>FIL D'ACTIVITÉ</Text>
            <MaterialIcons name={expandedSections.feed ? "expand-less" : "expand-more"} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          {expandedSections.feed && (
            <TouchableOpacity style={styles.bubbleRow} onPress={() => setShowFeedModal(true)}>
              <View style={styles.bubbleIcon}>
                <MaterialIcons name="dynamic-feed" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bubbleName}>Fil d'activité</Text>
                {feedItems.length > 0 ? (
                  <Text style={styles.bubblePreview} numberOfLines={1}>
                    {feedItems[0]?.user?.username} {feedItems[0]?.description || 'Nouvelle activité'}
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
          )}
          <View style={styles.divider} />

          {/* NOTIFICATIONS */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('notifs')}>
            <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
            <MaterialIcons name={expandedSections.notifs ? "expand-less" : "expand-more"} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          {expandedSections.notifs && (
            <TouchableOpacity style={styles.bubbleRow} onPress={() => setShowNotifsModal(true)}>
              <View style={[styles.bubbleIcon, { backgroundColor: 'rgba(250,204,21,0.1)' }]}>
                <MaterialIcons name="notifications" size={24} color="#facc15" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bubbleName}>Notifications</Text>
                {notifications.length > 0 ? (
                  <Text style={styles.bubblePreview} numberOfLines={1}>
                    {notifications[0]?.sender?.username} {notifications[0]?.message || 'Nouvelle notification'}
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
          )}
          <View style={styles.divider} />

          {/* MESSAGES PRIVÉS */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('dms')}>
            <Text style={styles.sectionLabel}>MESSAGES PRIVÉS</Text>
            <MaterialIcons name={expandedSections.dms ? "expand-less" : "expand-more"} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          {expandedSections.dms && (
            <>
              {isLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} />
              ) : conversations.length === 0 ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <MaterialIcons name="chat-bubble-outline" size={40} color={COLORS.textMuted} />
                  <Text style={{ color: COLORS.textLight, fontSize: 15, fontWeight: '700', marginTop: 14 }}>
                    Aucun message privé
                  </Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                    Cherche un joueur via la barre en haut pour discuter !
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
                            <MaterialIcons name={isSelf ? 'bookmark' : 'person'} size={22} color={COLORS.primary} />
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

                      <TouchableOpacity onPress={() => setShowDmMenu(showDmMenu === convId ? null : convId)} style={{ padding: 8 }}>
                        <MaterialIcons name="more-vert" size={20} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>

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
            </>
          )}
        </ScrollView>
      )}

      {/* FEED MODAL */}
      <Modal visible={showFeedModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setShowFeedModal(false)} style={styles.navBtn}>
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
                <Text style={{ color: COLORS.textLight, fontSize: 16, fontWeight: '700', marginTop: 14 }}>Aucune activité</Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>Suis des joueurs pour voir leur activité ici</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.feedCard}
                onPress={() => {
                  setShowFeedModal(false);
                  if (item.contentId || item.content?._id) {
                    navigation.navigate('GameDetail', { id: item.contentId || item.content._id });
                  }
                }}
              >
                <TouchableOpacity onPress={() => { setShowFeedModal(false); navigation.navigate('Profile', { userId: item.user?._id }); }}>
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
                    <Text style={{ color: COLORS.primary, fontSize: 13, marginTop: 4, fontWeight: '600' }}>{item.content.title}</Text>
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

      {/* NOTIFICATIONS MODAL */}
      <Modal visible={showNotifsModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setShowNotifsModal(false)} style={styles.navBtn}>
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
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 70 }} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: 60 }}>
                <MaterialIcons name="notifications-none" size={48} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textLight, fontSize: 16, fontWeight: '700', marginTop: 14 }}>Aucune notification</Text>
              </View>
            }
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
                      setShowNotifsModal(false);
                      navigation.navigate('Profile', { userId: item.sender?._id });
                    } else if (item.relatedContent) {
                      setShowNotifsModal(false);
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.surface },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  divider: { height: 8, backgroundColor: COLORS.bgDark },
  bubbleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  bubbleIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder },
  bubbleName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  bubblePreview: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
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
  navBtn: { padding: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  modalHeaderTitle: { color: COLORS.textLight, fontSize: 18, fontWeight: '700' },
  readAllBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primaryBorder },
  readAllText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
  feedCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  feedAvatar: { width: 40, height: 40, borderRadius: 20 },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  notifUnread: { backgroundColor: 'rgba(124,58,237,0.05)' },
  notifIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  notifAvatar: { width: 32, height: 32, borderRadius: 16 },

  // --- NOUVEAUX STYLES DE RECHERCHE ---
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceElevated, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, color: COLORS.textLight, marginLeft: 8, fontSize: 13, paddingVertical: 6 },
  searchResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  searchUsername: { color: COLORS.textLight, fontSize: 16, fontWeight: '600', flex: 1 },
});
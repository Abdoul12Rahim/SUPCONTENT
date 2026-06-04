import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert, Switch, Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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

const CURRENT_USER = {
  id: 'me', name: 'Moi',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  isAdmin: false,
};

const GAME_OPTIONS = [
  { id: '1', name: 'GTA VI', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Valorant', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Elden Ring', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&q=80' },
  { id: '4', name: 'Fortnite', image: 'https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=200&q=80' },
  { id: '5', name: 'Minecraft', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=200&q=80' },
  { id: '6', name: 'League of Legends', image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=200&q=80' },
];

const INITIAL_ROOMS = [
  {
    id: '101', game: 'GTA VI',
    image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80',
    description: 'Le salon officiel GTA VI — missions, spots, crews.',
    lastMessage: 'Quelqu\'un pour une session ce soir ?',
    lastTime: '14:05',
    unread: 3,
    isPublic: true,
    members: [
      { id: 'a1', name: 'XtremeGamer', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80', isAdmin: true },
      { id: 'a2', name: 'NightRider_99', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80', isAdmin: false },
    ],
    rules: ['Respect entre membres', 'Pas de spam', 'Parlez uniquement de GTA VI', 'Pas de publicité'],
    messages: [
      { id: 'm1', senderId: 'a1', senderName: 'XtremeGamer', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80', type: 'text', content: 'Bienvenue dans le salon GTA VI ! 🎮', time: '14:00' },
      { id: 'm2', senderId: 'a2', senderName: 'NightRider_99', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80', type: 'text', content: "Quelqu'un pour une session ce soir ?", time: '14:05' },
    ],
    joined: false,
    pendingRequest: false,
  },
  {
    id: '102', game: 'Valorant',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80',
    description: 'Team up, rank up. Salon compétitif Valorant.',
    lastMessage: 'Ranking session ce soir 20h !',
    lastTime: '12:30',
    unread: 1,
    isPublic: true,
    members: [
      { id: 'b1', name: 'ProShooter', avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=100&q=80', isAdmin: true },
    ],
    rules: ['Bon niveau requis', 'Pas de toxic behavior', 'Stratégies uniquement'],
    messages: [
      { id: 'm1', senderId: 'b1', senderName: 'ProShooter', avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=100&q=80', type: 'text', content: 'Ranking session ce soir 20h !', time: '12:30' },
    ],
    joined: false,
    pendingRequest: false,
  },
  {
    id: '103', game: 'Elden Ring',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&q=80',
    description: 'Pour les Tarnished. Boss rush, lore, speedrun.',
    lastMessage: 'Nouveau patch ! Malenia nerfée enfin 😤',
    lastTime: '10:00',
    unread: 0,
    isPublic: false,
    members: [
      { id: 'c1', name: 'SoulBorn', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80', isAdmin: true },
    ],
    rules: ['Pas de spoilers sans avertissement', 'Entraide bienvenue', 'On ne moque pas les débutants'],
    messages: [
      { id: 'm1', senderId: 'c1', senderName: 'SoulBorn', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80', type: 'text', content: 'Nouveau patch ! Malenia nerfée enfin 😤', time: '10:00' },
    ],
    joined: false,
    pendingRequest: false,
  },
];

const GIFS = [
  { id: 'g1', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', label: 'GG' },
  { id: 'g2', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', label: 'LOL' },
  { id: 'g3', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', label: 'Win' },
  { id: 'g4', url: 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif', label: 'Hype' },
  { id: 'g5', url: 'https://media.giphy.com/media/xT9IgG50Lg7russbER/giphy.gif', label: 'Rage' },
];

const TIPS = [
  { icon: 'lock', title: 'Salon privé', desc: 'Passe un salon en "Sur invitation" pour contrôler qui entre. Les autres peuvent voir les messages mais pas écrire.' },
  { icon: 'admin-panel-settings', title: 'Admins', desc: 'Nomme des admins de confiance pour t\'aider à gérer le salon. Les admins peuvent expulser des membres.' },
  { icon: 'sports-esports', title: 'Jeu associé', desc: 'Chaque salon est lié à un seul jeu. Ça aide les gamers à trouver leur communauté facilement.' },
  { icon: 'rule', title: 'Règles', desc: 'Définis des règles claires dès le début. Chaque nouveau membre devra les accepter avant d\'entrer.' },
  { icon: 'gif', title: 'GIFs & Vocaux', desc: 'Envoie des GIFs ou messages vocaux pour animer les échanges. Pas de fichiers ou photos pour garder ça simple.' },
  { icon: 'search', title: 'Trouver un salon', desc: 'Utilise la recherche pour trouver un salon par nom de jeu. Les salons publics sont ouverts à tous.' },
];

export default function RoomsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [activeRoom, setActiveRoom] = useState(null);
  const [viewRoom, setViewRoom] = useState(null); // room preview (voir sans rejoindre)
  const [showRules, setShowRules] = useState(false);
  const [pendingRoom, setPendingRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [showGifs, setShowGifs] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPublic, setNewRoomPublic] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const flatListRef = useRef(null);

  const filteredRooms = rooms.filter(r =>
    r.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tap a room row → open preview
  const handleTapRoom = (room) => {
    setViewRoom(room);
  };

  // Join button inside preview
  const handleJoinFromPreview = (room) => {
    setViewRoom(null);
    if (room.joined) {
      setActiveRoom(room);
      return;
    }
    setPendingRoom(room);
    setShowRules(true);
  };

  const confirmJoin = () => {
    const isPrivate = !pendingRoom.isPublic;
    if (isPrivate) {
      // send join request
      setRooms(prev => prev.map(r => r.id === pendingRoom.id ? { ...r, pendingRequest: true } : r));
      setShowRules(false);
      setPendingRoom(null);
      Alert.alert('Demande envoyée', 'Un admin devra approuver ta demande pour que tu puisses écrire.');
      return;
    }
    const updatedRoom = {
      ...pendingRoom,
      joined: true,
      unread: 0,
      members: [...pendingRoom.members, { ...CURRENT_USER, isAdmin: false }],
    };
    setRooms(prev => prev.map(r => r.id === pendingRoom.id ? updatedRoom : r));
    setShowRules(false);
    setActiveRoom(updatedRoom);
    setPendingRoom(null);
  };

  const leaveRoom = () => {
    Alert.alert('Quitter', 'Êtes-vous sûr de vouloir quitter ce salon ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter', style: 'destructive', onPress: () => {
          setRooms(prev => prev.map(r =>
            r.id === activeRoom.id
              ? { ...r, joined: false, pendingRequest: false, members: r.members.filter(m => m.id !== CURRENT_USER.id) }
              : r
          ));
          setActiveRoom(null);
          setShowMenu(false);
        }
      }
    ]);
  };

  const sendMessage = (type, content) => {
    if (type === 'text' && !content.trim()) return;
    const msg = {
      id: Date.now().toString(),
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar,
      type, content,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = { ...activeRoom, messages: [...activeRoom.messages, msg], lastMessage: content, lastTime: msg.time };
    setRooms(prev => prev.map(r => r.id === activeRoom.id ? updated : r));
    setActiveRoom(updated);
    setInputText('');
    setShowGifs(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleKickMember = (memberId) => {
    Alert.alert('Expulser', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Expulser', style: 'destructive', onPress: () => {
          const updated = { ...activeRoom, members: activeRoom.members.filter(m => m.id !== memberId) };
          setRooms(prev => prev.map(r => r.id === activeRoom.id ? updated : r));
          setActiveRoom(updated);
        }
      }
    ]);
  };

  const toggleMemberAdmin = (memberId) => {
    const updated = {
      ...activeRoom,
      members: activeRoom.members.map(m => m.id === memberId ? { ...m, isAdmin: !m.isAdmin } : m),
    };
    setRooms(prev => prev.map(r => r.id === activeRoom.id ? updated : r));
    setActiveRoom(updated);
  };

  const toggleRoomPublic = (value) => {
    const updated = { ...activeRoom, isPublic: value };
    setRooms(prev => prev.map(r => r.id === activeRoom.id ? updated : r));
    setActiveRoom(updated);
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim() || !selectedGame) {
      Alert.alert('Champs manquants', 'Choisis un jeu et donne un nom au salon.');
      return;
    }
    const newRoom = {
      id: Date.now().toString(),
      game: selectedGame.name,
      image: selectedGame.image,
      description: newRoomDesc.trim() || `Salon ${selectedGame.name}`,
      lastMessage: 'Salon créé !',
      lastTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      isPublic: newRoomPublic,
      members: [{ ...CURRENT_USER, isAdmin: true }],
      rules: ['Respect entre membres', 'Pas de spam'],
      messages: [],
      joined: true,
      pendingRequest: false,
    };
    setRooms(prev => [newRoom, ...prev]);
    setShowCreateRoom(false);
    setNewRoomName(''); setNewRoomDesc(''); setSelectedGame(null); setNewRoomPublic(true);
    setActiveRoom(newRoom);
  };

  const isCurrentUserAdmin = activeRoom?.members?.find(m => m.id === CURRENT_USER.id)?.isAdmin;
  const canWrite = activeRoom?.joined && !activeRoom?.pendingRequest;

  // ─────────────────────────────────────────
  // CHAT VIEW
  // ─────────────────────────────────────────
  if (activeRoom) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
        {/* Header — fixed at very top */}
        <View style={[styles.chatHeader, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={() => setActiveRoom(null)} style={styles.navIconBtn}>
            <MaterialIcons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            onPress={() => setShowGroupInfo(true)}
          >
            <Image source={{ uri: activeRoom.image }} style={styles.chatRoomAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.chatRoomName}>{activeRoom.game}</Text>
              <Text style={styles.chatMemberCount}>{activeRoom.members.length} membres · {activeRoom.isPublic ? 'Public' : 'Sur invitation'}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMembers(true)} style={styles.navIconBtn}>
            <MaterialIcons name="people" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.navIconBtn}>
            <MaterialIcons name="more-vert" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={activeRoom.messages}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          style={{ flex: 1 }}
          renderItem={({ item }) => {
            const isMe = item.senderId === CURRENT_USER.id;
            return (
              <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && <Image source={{ uri: item.avatar }} style={styles.msgAvatar} />}
                <View style={{ maxWidth: '75%' }}>
                  {!isMe && <Text style={styles.msgSender}>{item.senderName}</Text>}
                  <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                    {item.type === 'gif' ? (
                      <Image source={{ uri: item.content }} style={styles.gifImg} resizeMode="cover" />
                    ) : item.type === 'voice' ? (
                      <View style={styles.voiceBubble}>
                        <MaterialIcons name="mic" size={18} color={isMe ? 'white' : COLORS.primary} />
                        <Text style={[styles.voiceText, { color: isMe ? 'white' : COLORS.textLight }]}>Message vocal</Text>
                        <MaterialIcons name="play-arrow" size={20} color={isMe ? 'white' : COLORS.primary} />
                      </View>
                    ) : (
                      <Text style={[styles.msgText, { color: isMe ? 'white' : COLORS.textLight }]}>{item.content}</Text>
                    )}
                  </View>
                  <Text style={[styles.msgTime, isMe && { textAlign: 'right' }]}>{item.time}</Text>
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
                <TouchableOpacity key={gif.id} onPress={() => sendMessage('gif', gif.url)} style={styles.gifThumb}>
                  <Image source={{ uri: gif.url }} style={{ width: 80, height: 60, borderRadius: 8 }} />
                  <Text style={styles.gifLabel}>{gif.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input — above bottom nav, uses KeyboardAvoidingView */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.inputRow, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
            {canWrite ? (
              <>
                <TouchableOpacity onPress={() => setShowGifs(!showGifs)} style={styles.inputAction}>
                  <Text style={{ fontSize: 22 }}>😄</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => sendMessage('voice', 'vocal')} style={styles.inputAction}>
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
              </>
            ) : (
              <View style={styles.lockedBar}>
                <MaterialIcons name={activeRoom.pendingRequest ? 'hourglass-empty' : 'lock'} size={18} color={COLORS.textMuted} />
                <Text style={styles.lockedText}>
                  {activeRoom.pendingRequest ? 'Demande en attente d\'approbation' : 'Rejoins le salon pour écrire'}
                </Text>
                {!activeRoom.pendingRequest && (
                  <TouchableOpacity onPress={() => handleJoinFromPreview(activeRoom)} style={styles.lockJoinBtn}>
                    <Text style={styles.lockJoinText}>Rejoindre</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* 3-dot Menu */}
        <Modal visible={showMenu} animationType="fade" transparent>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={[styles.menuSheet, { top: insets.top + 54 }]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowGroupInfo(true); setShowMenu(false); }}>
                <MaterialIcons name="info-outline" size={20} color={COLORS.textLight} />
                <Text style={styles.menuItemText}>Infos du groupe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMembers(true); setShowMenu(false); }}>
                <MaterialIcons name="people-outline" size={20} color={COLORS.textLight} />
                <Text style={styles.menuItemText}>Membres</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); Alert.alert('Signalement envoyé', 'Merci, notre équipe va examiner ce salon.'); }}>
                <MaterialIcons name="flag" size={20} color="#f59e0b" />
                <Text style={[styles.menuItemText, { color: '#f59e0b' }]}>Signaler</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={leaveRoom}>
                <MaterialIcons name="exit-to-app" size={20} color={COLORS.danger} />
                <Text style={[styles.menuItemText, { color: COLORS.danger }]}>Quitter le salon</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Group Info Modal */}
        <Modal visible={showGroupInfo} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '88%' }]}>
              <View style={styles.modalHandle} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: activeRoom.image }} style={styles.infoRoomImg} />
                <Text style={styles.modalTitle}>{activeRoom.game}</Text>
                <Text style={styles.infoDesc}>{activeRoom.description}</Text>
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionLabel}>Créateur</Text>
                  {activeRoom.members.filter(m => m.isAdmin).map(admin => (
                    <View key={admin.id} style={styles.infoAdminRow}>
                      <Image source={{ uri: admin.avatar }} style={styles.infoAdminAvatar} />
                      <Text style={styles.infoAdminName}>{admin.name}</Text>
                      <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>
                    </View>
                  ))}
                </View>
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionLabel}>Membres ({activeRoom.members.length})</Text>
                </View>
                {isCurrentUserAdmin && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionLabel}>Accès</Text>
                    <View style={styles.accessRow}>
                      <View>
                        <Text style={{ color: COLORS.textLight, fontWeight: '600', fontSize: 14 }}>{activeRoom.isPublic ? 'Public' : 'Sur invitation'}</Text>
                        <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>{activeRoom.isPublic ? 'Tout le monde peut rejoindre' : 'Approbation requise'}</Text>
                      </View>
                      <Switch value={activeRoom.isPublic} onValueChange={toggleRoomPublic} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor="white" />
                    </View>
                  </View>
                )}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionLabel}>Thème</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                    {['#7c3aed', '#ef4444', '#10b981', '#f59e0b', '#06b6d4'].map(color => (
                      <TouchableOpacity key={color} style={[styles.themeColor, { backgroundColor: color }]} />
                    ))}
                  </View>
                </View>
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionLabel}>Règles</Text>
                  {activeRoom.rules.map((rule, i) => (
                    <View key={i} style={styles.ruleRow}>
                      <View style={styles.ruleDot} />
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity onPress={() => setShowGroupInfo(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Members Modal */}
        <Modal visible={showMembers} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '70%' }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Membres · {activeRoom.members.length}</Text>
              <ScrollView>
                {activeRoom.members.map(member => (
                  <View key={member.id} style={styles.memberRow}>
                    <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.isAdmin && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>}
                    </View>
                    {isCurrentUserAdmin && member.id !== CURRENT_USER.id && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => toggleMemberAdmin(member.id)} style={[styles.memberActionBtn, { backgroundColor: 'rgba(124,58,237,0.15)' }]}>
                          <MaterialIcons name={member.isAdmin ? 'remove-moderator' : 'add-moderator'} size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                        {!member.isAdmin && (
                          <TouchableOpacity onPress={() => handleKickMember(member.id)} style={[styles.memberActionBtn, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                            <MaterialIcons name="person-remove" size={16} color={COLORS.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => setShowMembers(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ─────────────────────────────────────────
  // ROOMS LIST (WhatsApp style)
  // ─────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
      {/* Header */}
      <View style={[styles.listHeader, { paddingTop: insets.top + 8 }]}>
        {showSearch ? (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un salon..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.listTitle}>Salons</Text>
            <View style={styles.listHeaderActions}>
              <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.headerIconBtn}>
                <MaterialIcons name="search" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTopMenu(true)} style={styles.headerIconBtn}>
                <MaterialIcons name="more-vert" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Room list — WhatsApp style rows */}
      <FlatList
        data={filteredRooms}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.roomRow} activeOpacity={0.7} onPress={() => handleTapRoom(item)}>
            <View style={styles.roomRowAvatarWrap}>
              <Image source={{ uri: item.image }} style={styles.roomRowAvatar} />
              <View style={[styles.roomRowDot, { backgroundColor: item.isPublic ? COLORS.accentGreen : COLORS.primary }]} />
            </View>
            <View style={styles.roomRowContent}>
              <View style={styles.roomRowTop}>
                <Text style={styles.roomRowName}>{item.game}</Text>
                <Text style={styles.roomRowTime}>{item.lastTime}</Text>
              </View>
              <View style={styles.roomRowBottom}>
                <Text style={styles.roomRowLast} numberOfLines={1}>{item.lastMessage}</Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
                {item.pendingRequest && (
                  <View style={[styles.unreadBadge, { backgroundColor: '#f59e0b' }]}>
                    <MaterialIcons name="hourglass-empty" size={11} color="white" />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 84 }} />}
      />

      {/* Top 3-dot menu */}
      <Modal visible={showTopMenu} animationType="fade" transparent>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowTopMenu(false)}>
          <View style={[styles.menuSheet, { top: insets.top + 50, right: 12 }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowTopMenu(false); setShowCreateRoom(true); }}>
              <MaterialIcons name="add" size={20} color={COLORS.textLight} />
              <Text style={styles.menuItemText}>Créer un salon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowTopMenu(false); setShowTips(true); }}>
              <MaterialIcons name="lightbulb-outline" size={20} color="#f59e0b" />
              <Text style={[styles.menuItemText, { color: '#f59e0b' }]}>Conseils sur les salons</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Room Preview Modal (tap on room → see messages + join button) */}
      <Modal visible={!!viewRoom} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '88%', paddingBottom: 24 }]}>
            <View style={styles.modalHandle} />
            {viewRoom && (
              <>
                {/* Preview header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Image source={{ uri: viewRoom.image }} style={{ width: 52, height: 52, borderRadius: 26, marginRight: 12, borderWidth: 2, borderColor: COLORS.primaryBorder }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{viewRoom.game}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <MaterialIcons name={viewRoom.isPublic ? 'public' : 'lock'} size={12} color={viewRoom.isPublic ? COLORS.accentGreen : COLORS.primary} />
                      <Text style={{ color: viewRoom.isPublic ? COLORS.accentGreen : COLORS.primary, fontSize: 12, fontWeight: '600' }}>
                        {viewRoom.isPublic ? 'Public' : 'Sur invitation'}
                      </Text>
                      <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>· {viewRoom.members.length} membres</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setViewRoom(null)}>
                    <MaterialIcons name="close" size={22} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Preview messages (read-only) */}
                <View style={{ backgroundColor: COLORS.bgDark, borderRadius: 14, padding: 12, maxHeight: 260, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 }}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {viewRoom.messages.length === 0 ? (
                      <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 }}>Aucun message pour l'instant.</Text>
                    ) : viewRoom.messages.map(msg => (
                      <View key={msg.id} style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' }}>
                        <Image source={{ uri: msg.avatar }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 3 }}>{msg.senderName}</Text>
                          <View style={{ backgroundColor: COLORS.surface, borderRadius: 12, borderBottomLeftRadius: 4, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start', maxWidth: '90%' }}>
                            <Text style={{ color: COLORS.textLight, fontSize: 14 }}>{msg.content}</Text>
                          </View>
                          <Text style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 3 }}>{msg.time}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  {/* Blur hint if not joined */}
                  {!viewRoom.joined && (
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: 'rgba(13,13,20,0.7)', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>Rejoins pour écrire des messages</Text>
                    </View>
                  )}
                </View>

                {/* Action */}
                {viewRoom.joined ? (
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => { setViewRoom(null); setActiveRoom(viewRoom); }}>
                    <Text style={styles.acceptBtnText}>Ouvrir le salon</Text>
                  </TouchableOpacity>
                ) : viewRoom.pendingRequest ? (
                  <View style={[styles.acceptBtn, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]}>
                    <Text style={[styles.acceptBtnText, { color: '#f59e0b' }]}>Demande en attente d'approbation</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleJoinFromPreview(viewRoom)}>
                    <Text style={styles.acceptBtnText}>
                      {viewRoom.isPublic ? 'Rejoindre le salon' : 'Demander à rejoindre'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Rules Modal */}
      <Modal visible={showRules} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {pendingRoom && (
              <>
                <Image source={{ uri: pendingRoom.image }} style={styles.rulesRoomImg} />
                <Text style={styles.modalTitle}>{pendingRoom.game}</Text>
                <Text style={styles.rulesSubtitle}>
                  {pendingRoom.isPublic ? 'Règles du salon' : 'Salon sur invitation — ta demande sera examinée par un admin.'}
                </Text>
                <View style={styles.rulesList}>
                  {pendingRoom.rules.map((rule, i) => (
                    <View key={i} style={styles.ruleRow}>
                      <View style={styles.ruleDot} />
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.acceptBtn} onPress={confirmJoin}>
                  <Text style={styles.acceptBtnText}>
                    {pendingRoom.isPublic ? "J'accepte & je rejoins" : "J'accepte & j'envoie ma demande"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowRules(false)} style={{ marginTop: 12, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Tips Modal */}
      <Modal visible={showTips} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '88%' }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>💡 Conseils sur les salons</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 16 }}>Tout ce que tu dois savoir pour bien gérer ton salon.</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {TIPS.map((tip, i) => (
                <View key={i} style={styles.tipCard}>
                  <View style={styles.tipIcon}>
                    <MaterialIcons name={tip.icon} size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDesc}>{tip.desc}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowTips(false)} style={[styles.closeModalBtn, { marginTop: 16 }]}>
              <Text style={styles.closeModalText}>Compris !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Room Modal */}
      <Modal visible={showCreateRoom} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.modalSheet, { maxHeight: '92%' }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Créer un salon</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.createLabel}>Jeu associé *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {GAME_OPTIONS.map(game => (
                    <TouchableOpacity key={game.id} onPress={() => setSelectedGame(game)} style={[styles.gameOption, selectedGame?.id === game.id && { opacity: 1 }]}>
                      <View style={{ position: 'relative' }}>
                        <Image source={{ uri: game.image }} style={[styles.gameOptionImg, selectedGame?.id === game.id && { borderColor: COLORS.primary }]} />
                        {selectedGame?.id === game.id && (
                          <View style={styles.gameOptionCheck}>
                            <MaterialIcons name="check" size={14} color="white" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.gameOptionName}>{game.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.createLabel}>Nom du salon *</Text>
                <TextInput style={styles.createInput} placeholder="Ex: GTA VI — Missions nocturnes" placeholderTextColor={COLORS.textMuted} value={newRoomName} onChangeText={setNewRoomName} />
                <Text style={styles.createLabel}>Description</Text>
                <TextInput style={[styles.createInput, { height: 80, textAlignVertical: 'top' }]} placeholder="Décrivez votre salon..." placeholderTextColor={COLORS.textMuted} value={newRoomDesc} onChangeText={setNewRoomDesc} multiline />
                <View style={styles.accessRow}>
                  <View>
                    <Text style={styles.createLabel}>Accès public</Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>{newRoomPublic ? 'Tout le monde peut rejoindre' : 'Sur invitation uniquement'}</Text>
                  </View>
                  <Switch value={newRoomPublic} onValueChange={setNewRoomPublic} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor="white" />
                </View>
              </ScrollView>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleCreateRoom}>
                <Text style={styles.acceptBtnText}>Créer le salon</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreateRoom(false)} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // List header
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgDark,
  },
  listTitle: { color: COLORS.textLight, fontSize: 24, fontWeight: '800' },
  listHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: { padding: 8 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12,
    paddingHorizontal: 12, height: 40,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, color: COLORS.textLight, marginLeft: 8, fontSize: 14 },
  // WhatsApp-style room rows
  roomRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.bgDark,
  },
  roomRowAvatarWrap: { position: 'relative', marginRight: 14 },
  roomRowAvatar: { width: 54, height: 54, borderRadius: 27 },
  roomRowDot: { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: COLORS.bgDark },
  roomRowContent: { flex: 1 },
  roomRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roomRowName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  roomRowTime: { color: COLORS.textMuted, fontSize: 12 },
  roomRowBottom: { flexDirection: 'row', alignItems: 'center' },
  roomRowLast: { color: COLORS.textMuted, fontSize: 13, flex: 1, marginRight: 8 },
  unreadBadge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  unreadText: { color: 'white', fontSize: 11, fontWeight: '700' },
  // Chat
  chatHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chatRoomAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1, borderColor: COLORS.primaryBorder },
  chatRoomName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  chatMemberCount: { color: COLORS.textMuted, fontSize: 11 },
  navIconBtn: { padding: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  msgSender: { color: COLORS.textMuted, fontSize: 11, marginBottom: 4, marginLeft: 4 },
  msgBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  msgBubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTime: { color: COLORS.textMuted, fontSize: 10, marginTop: 4, marginHorizontal: 4 },
  gifImg: { width: 180, height: 120, borderRadius: 12 },
  voiceBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceText: { fontSize: 13, fontStyle: 'italic' },
  gifPicker: { backgroundColor: COLORS.surface, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  gifThumb: { alignItems: 'center', marginRight: 10 },
  gifLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputAction: { padding: 6, marginRight: 2 },
  chatInput: {
    flex: 1, backgroundColor: COLORS.bgDark, color: COLORS.textLight,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, borderWidth: 1, borderColor: COLORS.border, maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: COLORS.primary, width: 40, height: 40,
    borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  lockedBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bgDark, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  lockedText: { color: COLORS.textMuted, fontSize: 13, flex: 1 },
  lockJoinBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  lockJoinText: { color: 'white', fontWeight: '700', fontSize: 12 },
  // Menus
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  menuSheet: {
    position: 'absolute', right: 12,
    backgroundColor: COLORS.surfaceElevated, borderRadius: 16,
    padding: 8, minWidth: 220,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10 },
  menuItemText: { color: COLORS.textLight, fontSize: 15, fontWeight: '600' },
  menuDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surfaceElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.textLight, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  infoRoomImg: { width: '100%', height: 120, borderRadius: 14, marginBottom: 14 },
  infoDesc: { color: COLORS.textMuted, fontSize: 13, marginBottom: 16, lineHeight: 20 },
  infoSection: { marginBottom: 20 },
  infoSectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  infoAdminRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoAdminAvatar: { width: 36, height: 36, borderRadius: 18 },
  infoAdminName: { color: COLORS.textLight, fontWeight: '600', fontSize: 14, flex: 1 },
  accessRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  themeColor: { width: 32, height: 32, borderRadius: 16 },
  rulesRoomImg: { width: '100%', height: 100, borderRadius: 14, marginBottom: 14 },
  rulesSubtitle: { color: COLORS.textMuted, fontSize: 13, marginBottom: 14, lineHeight: 18 },
  rulesList: { marginBottom: 20 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  ruleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 6, marginRight: 10 },
  ruleText: { color: COLORS.textLight, fontSize: 14, flex: 1, lineHeight: 20 },
  acceptBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  acceptBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  memberName: { color: COLORS.textLight, fontWeight: '600', fontSize: 14 },
  adminBadge: { backgroundColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 3, borderWidth: 1, borderColor: COLORS.primaryBorder },
  adminBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  memberActionBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  closeModalBtn: { backgroundColor: COLORS.surface, paddingVertical: 13, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  closeModalText: { color: COLORS.textLight, fontWeight: '700' },
  // Create room
  createLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  createInput: { backgroundColor: COLORS.bgDark, color: COLORS.textLight, borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  gameOption: { alignItems: 'center', marginRight: 12 },
  gameOptionImg: { width: 80, height: 80, borderRadius: 12, marginBottom: 6, borderWidth: 2, borderColor: 'transparent' },
  gameOptionName: { color: COLORS.textLight, fontSize: 11, fontWeight: '600', textAlign: 'center', maxWidth: 80 },
  gameOptionCheck: { position: 'absolute', top: 4, right: 4, backgroundColor: COLORS.primary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  // Tips
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 18 },
  tipIcon: { backgroundColor: COLORS.primaryLight, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryBorder },
  tipTitle: { color: COLORS.textLight, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  tipDesc: { color: COLORS.textMuted, fontSize: 13, lineHeight: 19 },
});
import React, { useState, useRef, useContext, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { socialAPI } from '../services/api';

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
  danger: '#ef4444'
};

export default function RoomChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const flatListRef = useRef(null);
  
  const [room, setRoom] = useState(route.params?.room || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  const isJoined = room?.members?.some(m => m.user?._id === user?._id || m.user === user?._id);
  
  const getCurrentUserRole = useCallback(() => {
    const member = room?.members?.find(m => m.user?._id === user?._id || m.user === user?._id);
    return member?.role || null;
  }, [room?.members, user?._id]);

  const isModerator = () => {
    const role = getCurrentUserRole();
    return role === 'admin' || role === 'moderator';
  };

  const isAdmin = () => {
    const role = getCurrentUserRole();
    return role === 'admin';
  };

  const fetchRoomData = useCallback(async () => {
    try {
      if (room?._id) {
        // Fetch messages et infos du salon
        const roomRes = await socialAPI.getRoomById(room._id);
        if (roomRes.data) {
          setRoom(roomRes.data);
        }
      }
    } catch (e) {
      console.log('Erreur fetchRoomData:', e.message);
    }
  }, [room?._id]);

  useFocusEffect(
    useCallback(() => {
      fetchRoomData();
      
      // Polling toutes les 3s
      const interval = setInterval(() => {
        fetchRoomData();
      }, 3000);
      setPollingInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }, [fetchRoomData])
  );

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [messages]);

  const confirmJoin = async () => {
    try {
      setIsLoading(true);
      const res = await socialAPI.joinRoom(room._id);
      setShowRules(false);
      
      if (res.data?.room) {
        setRoom(res.data.room);
      } else {
        setRoom(prev => ({
          ...prev,
          members: [...(prev?.members || []), { user: user._id, role: 'normal', joinedAt: new Date() }]
        }));
      }
      
      Alert.alert('Succès', 'Bienvenue dans le salon!');
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible de rejoindre.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await socialAPI.sendRoomMessage(room._id, {
        content: messageText,
        type: 'text'
      });

      if (res.data) {
        setMessages(prev => [...prev, res.data]);
      }
    } catch (e) {
      console.log('Erreur sendMessage:', e.message);
      Alert.alert('Erreur', 'Message non envoyé');
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveRoom = async () => {
    Alert.alert('Quitter', 'Êtes-vous sûr de vouloir quitter ce salon?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter', style: 'destructive', onPress: async () => {
          try {
            await socialAPI.leaveRoom(room._id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Erreur', 'Impossible de quitter.');
          }
        }
      }
    ]);
  };

  const handleBanUser = (targetUser) => {
    Alert.alert('Bannir l\'utilisateur', `Bannir ${targetUser.username}?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Bannir', style: 'destructive', onPress: async () => {
          try {
            await socialAPI.banUserFromRoom(room._id, targetUser._id, {
              duration: '1_week',
              reason: 'Moderation action'
            });
            Alert.alert('Succès', 'Utilisateur banni');
            fetchRoomData();
          } catch (e) {
            Alert.alert('Erreur', e.response?.data?.message || 'Impossible de bannir');
          }
        }
      }
    ]);
  };

  const getRoomMembersList = () => {
    return room?.members || [];
  };

  const getMemberRole = (role) => {
    if (role === 'admin') return '👑 Admin';
    if (role === 'moderator') return '🛡️ Modérateur';
    return '👤 Membre';
  };

  if (!room) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

 return (
    // 1. Le KeyboardAvoidingView devient la racine de l'écran
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: COLORS.bgDark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.chatHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIconBtn}>
          <MaterialIcons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          onPress={() => setShowMembers(true)}
        >
          <View style={styles.chatRoomAvatarPlaceholder}>
            <MaterialIcons name="sports-esports" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.chatRoomName} numberOfLines={1}>{room.name}</Text>
            <Text style={styles.chatMemberCount}>
              {room.members?.length || 0} membres · {room.visibility === 'public' ? '🔓 Public' : '🔒 Privé'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.navIconBtn}>
          <MaterialIcons name="more-vert" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        style={{ flex: 1 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyChatContainer}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyChatText}>Bienvenue dans le salon!</Text>
            <Text style={styles.emptyChatSub}>Sois le premier à écrire un message.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sender = item.sender || {};
          return (
            <View style={styles.msgRow}>
              <TouchableOpacity onPress={() => sender._id && navigation.navigate('Profile', { userId: sender._id })}>
                {sender.avatar ? (
                  <Image source={{ uri: sender.avatar }} style={styles.msgAvatar} />
                ) : (
                  <View style={[styles.msgAvatar, { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                    <MaterialIcons name="person" size={14} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <View style={styles.msgHeader}>
                  <Text style={styles.msgSenderName}>{sender.username || 'Anonyme'}</Text>
                  <Text style={styles.msgTime}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
                
                <View style={styles.msgBubbleOther}>
                  <Text style={styles.msgText}>{item.content}</Text>
                </View>
              </View>

              {isModerator() && sender._id !== user._id && (
                <TouchableOpacity onPress={() => handleBanUser(sender)} style={styles.msgActionBtn}>
                  <MaterialIcons name="block" size={16} color={COLORS.danger} />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Input (Débarrassé de son propre KeyboardAvoidingView) */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
        {isJoined ? (
          <>
            <TextInput 
              style={styles.chatInput} 
              placeholder="Écrire dans le salon..." 
              placeholderTextColor={COLORS.textMuted} 
              value={inputText} 
              onChangeText={setInputText}
              editable={!isSending}
              multiline 
            />
            <TouchableOpacity 
              style={[styles.sendBtn, { opacity: (inputText.trim() && !isSending) ? 1 : 0.4 }]} 
              onPress={sendMessage}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <MaterialIcons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.lockedBar}>
            <MaterialIcons name="lock" size={18} color={COLORS.textMuted} />
            <Text style={styles.lockedText}>Rejoins pour écrire</Text>
            <TouchableOpacity onPress={() => setShowRules(true)} style={styles.lockJoinBtn}>
              <Text style={styles.lockJoinText}>Rejoindre</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Menu */}
      <Modal visible={showMenu} animationType="fade" transparent>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuSheet, { top: insets.top + 54, right: 12 }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); setShowMembers(true); }}>
              <MaterialIcons name="people" size={20} color={COLORS.textLight} />
              <Text style={styles.menuItemText}>Voir les membres</Text>
            </TouchableOpacity>
            {isJoined && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); setShowRules(true); }}>
                <MaterialIcons name="description" size={20} color={COLORS.textLight} />
                <Text style={styles.menuItemText}>Voir les règles</Text>
              </TouchableOpacity>
            )}
            {isJoined && (
              <TouchableOpacity style={styles.menuItem} onPress={handleLeaveRoom}>
                <MaterialIcons name="exit-to-app" size={20} color={COLORS.danger} />
                <Text style={[styles.menuItemText, { color: COLORS.danger }]}>Quitter le salon</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Règles Modal */}
      <Modal visible={showRules} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Charte de bonne conduite</Text>
            <Text style={styles.rulesSubtitle}>Bienvenue! Lis et accepte les règles pour participer.</Text>
            
            {room.rules ? (
              <Text style={styles.rulesContent}>{room.rules}</Text>
            ) : (
              <>
                <View style={styles.ruleRow}>
                  <View style={styles.ruleDot} />
                  <Text style={styles.ruleText}>Respect mutuel entre tous les joueurs</Text>
                </View>
                <View style={styles.ruleRow}>
                  <View style={styles.ruleDot} />
                  <Text style={styles.ruleText}>Pas de spam, insultes ou comportements toxiques</Text>
                </View>
                <View style={styles.ruleRow}>
                  <View style={styles.ruleDot} />
                  <Text style={styles.ruleText}>Respecte les décisions des modérateurs</Text>
                </View>
                <View style={styles.ruleRow}>
                  <View style={styles.ruleDot} />
                  <Text style={styles.ruleText}>Partage constructif et bienveillant uniquement</Text>
                </View>
              </>
            )}

            {!isJoined ? (
              <>
                <TouchableOpacity 
                  style={[styles.acceptBtn, isLoading && { opacity: 0.6 }]} 
                  onPress={confirmJoin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.acceptBtnText}>J'accepte les règles · Rejoindre</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowRules(false)} style={{ marginTop: 14, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textMuted }}>Annuler</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setShowRules(false)} style={[styles.acceptBtn, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.acceptBtnText}>Fermer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Membres Modal */}
      <Modal visible={showMembers} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={[styles.membersHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setShowMembers(false)} style={styles.navIconBtn}>
              <MaterialIcons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.membersTitle}>Membres ({getRoomMembersList().length})</Text>
            <View style={{ width: 38 }} />
          </View>

          <FlatList
            data={getRoomMembersList()}
            keyExtractor={(item, i) => item.user?._id || i.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => {
              const memberUser = item.user || {};
              return (
                <TouchableOpacity 
                  style={styles.memberRow}
                  onPress={() => memberUser._id && navigation.navigate('Profile', { userId: memberUser._id })}
                >
                  <View style={styles.memberAvatarWrap}>
                    {memberUser.avatar ? (
                      <Image source={{ uri: memberUser.avatar }} style={styles.memberAvatar} />
                    ) : (
                      <View style={[styles.memberAvatar, { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                        <MaterialIcons name="person" size={18} color={COLORS.primary} />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{memberUser.username || 'Anonyme'}</Text>
                    <Text style={styles.memberRole}>{getMemberRole(item.role)}</Text>
                  </View>

                  {isModerator() && memberUser._id !== user._id && item.role !== 'admin' && (
                    <TouchableOpacity onPress={() => handleBanUser(memberUser)}>
                      <MaterialIcons name="block" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chatHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 6, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    backgroundColor: COLORS.surface 
  },
  chatRoomAvatarPlaceholder: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: COLORS.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  chatRoomName: { 
    color: COLORS.textLight, 
    fontWeight: '700', 
    fontSize: 15 
  },
  chatMemberCount: { 
    color: COLORS.textMuted, 
    fontSize: 11 
  },
  navIconBtn: { 
    padding: 8 
  },
  emptyChatContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 80 
  },
  emptyChatText: { 
    color: COLORS.textLight, 
    fontSize: 15, 
    fontWeight: '700', 
    marginTop: 12 
  },
  emptyChatSub: { 
    color: COLORS.textMuted, 
    fontSize: 12, 
    marginTop: 4 
  },
  msgRow: { 
    flexDirection: 'row', 
    marginBottom: 14, 
    paddingHorizontal: 4,
    alignItems: 'flex-end'
  },
  msgAvatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    marginRight: 8 
  },
  msgHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 2 
  },
  msgSenderName: { 
    color: COLORS.textLight, 
    fontWeight: '700', 
    fontSize: 12 
  },
  msgTime: { 
    color: COLORS.textMuted, 
    fontSize: 10 
  },
  msgBubbleOther: { 
    backgroundColor: COLORS.surface, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12, 
    maxWidth: '90%' 
  },
  msgText: { 
    color: COLORS.textLight, 
    fontSize: 14, 
    lineHeight: 20 
  },
  msgActionBtn: { 
    padding: 6, 
    marginLeft: 4 
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 10, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border, 
    backgroundColor: COLORS.surface 
  },
  chatInput: { 
    flex: 1, 
    backgroundColor: COLORS.bgDark, 
    color: COLORS.textLight, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    fontSize: 14, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    maxHeight: 90 
  },
  sendBtn: { 
    backgroundColor: COLORS.primary, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 8 
  },
  lockedBar: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: COLORS.bgDark, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  lockedText: { 
    color: COLORS.textMuted, 
    fontSize: 13, 
    flex: 1, 
    fontWeight: '500' 
  },
  lockJoinBtn: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  lockJoinText: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 12 
  },
  menuOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.2)' 
  },
  menuSheet: { 
    position: 'absolute', 
    backgroundColor: COLORS.surfaceElevated, 
    borderRadius: 12, 
    padding: 6, 
    minWidth: 200, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    padding: 12, 
    borderRadius: 8 
  },
  menuItemText: { 
    color: COLORS.textLight, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end' 
  },
  modalSheet: { 
    backgroundColor: COLORS.surfaceElevated, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    paddingBottom: 30,
    maxHeight: '85%'
  },
  modalHandle: { 
    width: 36, 
    height: 4, 
    backgroundColor: COLORS.border, 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  modalTitle: { 
    color: COLORS.textLight, 
    fontSize: 18, 
    fontWeight: '800', 
    marginBottom: 8 
  },
  rulesSubtitle: { 
    color: COLORS.textMuted, 
    fontSize: 13, 
    marginBottom: 14 
  },
  rulesContent: { 
    color: COLORS.textLight, 
    fontSize: 13, 
    lineHeight: 20, 
    marginBottom: 14 
  },
  ruleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  ruleDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: COLORS.primary, 
    marginRight: 8 
  },
  ruleText: { 
    color: COLORS.textLight, 
    fontSize: 13 
  },
  acceptBtn: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10 
  },
  acceptBtnText: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 14 
  },
  membersHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 12, 
    paddingBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border, 
    backgroundColor: COLORS.surface 
  },
  membersTitle: { 
    color: COLORS.textLight, 
    fontSize: 18, 
    fontWeight: '700' 
  },
  memberRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  memberAvatarWrap: { 
    marginRight: 12 
  },
  memberAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22 
  },
  memberName: { 
    color: COLORS.textLight, 
    fontWeight: '700', 
    fontSize: 14 
  },
  memberRole: { 
    color: COLORS.textMuted, 
    fontSize: 12, 
    marginTop: 2 
  }
});
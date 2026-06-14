import React, { useState, useRef, useContext, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { socialAPI } from '../services/api';

const COLORS = { primary: '#7c3aed', primaryLight: 'rgba(124,58,237,0.15)', bgDark: '#0d0d14', surface: '#13131f', surfaceElevated: '#1a1a2e', border: 'rgba(255,255,255,0.06)', textLight: '#f1f5f9', textMuted: '#64748b', danger: '#ef4444' };

export default function RoomChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const flatListRef = useRef(null);
  
  // On récupère les infos du salon transmises par la navigation
  const [room, setRoom] = useState(route.params?.room || null);
  const [inputText, setInputText] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Vérification de l'adhésion en regardant dans le tableau des membres
  const isJoined = room?.members?.some(m => m.user?._id === user?._id || m.user === user?._id);

  const confirmJoin = async () => {
    try {
      const res = await socialAPI.joinRoom(room._id);
      setShowRules(false);
      Alert.alert('Succès', res.data?.message || 'Bienvenue !');
      
      setRoom(res.data.room || { ...room, members: [...room.members, { user: user._id, role: 'normal' }] });
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible de rejoindre.');
    }
  };

  const handleLeaveRoom = async () => {
    Alert.alert('Quitter', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter', style: 'destructive', onPress: async () => {
          try {
            await socialAPI.leaveRoom(room._id);
            navigation.goBack(); 
          } catch (e) { Alert.alert('Erreur', 'Impossible de quitter.'); }
        }
      }
    ]);
  };

  if (!room) return <View style={{ flex: 1, backgroundColor: COLORS.bgDark }} />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
      {/* Header */}
      <View style={[styles.chatHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIconBtn}>
          <MaterialIcons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={styles.chatRoomAvatarPlaceholder}>
            <MaterialIcons name="sports-esports" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.chatRoomName} numberOfLines={1}>{room.name}</Text>
            <Text style={styles.chatMemberCount}>{room.members?.length || 0} membres · {room.visibility === 'public' ? 'Public' : 'Privé'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.navIconBtn}>
          <MaterialIcons name="more-vert" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Zone des messages (Lecture) */}
      <FlatList
        ref={flatListRef}
        data={room.messages || []}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        style={{ flex: 1 }}
        ListEmptyComponent={
          <View style={styles.emptyChatContainer}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyChatText}>Bienvenue dans le salon historique.</Text>
            <Text style={styles.emptyChatSub}>Les échanges récents s'afficheront ici.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.msgRow}>
            <View style={styles.msgBubbleOther}>
              <Text style={styles.msgText}>{item.content}</Text>
            </View>
          </View>
        )}
      />

      {/* Clavier et barre d'action du bas */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={[styles.inputRow, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
          {isJoined ? (
            <>
              <TextInput style={styles.chatInput} placeholder="Écrire dans le salon..." placeholderTextColor={COLORS.textMuted} value={inputText} onChangeText={setInputText} multiline />
              <TouchableOpacity style={styles.sendBtn} disabled={!inputText.trim()}>
                <MaterialIcons name="send" size={20} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.lockedBar}>
              <MaterialIcons name="visibility" size={18} color={COLORS.textMuted} />
              <Text style={styles.lockedText}>Mode lecture seule actif</Text>
              <TouchableOpacity onPress={() => setShowRules(true)} style={styles.lockJoinBtn}>
                <Text style={styles.lockJoinText}>Rejoindre</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Menu Options */}
      <Modal visible={showMenu} animationType="fade" transparent>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuSheet, { top: insets.top + 54 }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); /* Ouvrir modale info */ }}>
              <MaterialIcons name="info-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.menuItemText}>Infos du salon</Text>
            </TouchableOpacity>
            {isJoined && (
              <TouchableOpacity style={styles.menuItem} onPress={handleLeaveRoom}>
                <MaterialIcons name="exit-to-app" size={20} color={COLORS.danger} />
                <Text style={[styles.menuItemText, { color: COLORS.danger }]}>Quitter le salon</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Charte d'acceptation */}
      <Modal visible={showRules} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Charte de bonne conduite</Text>
            <Text style={styles.rulesSubtitle}>En rejoignant ce salon, tu t'engages à respecter la communauté.</Text>
            <View style={styles.ruleRow}>
              <View style={styles.ruleDot} />
              <Text style={styles.ruleText}>Respect mutuel et entraide entre joueurs.</Text>
            </View>
            <View style={styles.ruleRow}>
              <View style={styles.ruleDot} />
              <Text style={styles.ruleText}>Pas de spam ni de comportements toxiques.</Text>
            </View>
            <TouchableOpacity style={styles.acceptBtn} onPress={confirmJoin}>
              <Text style={styles.acceptBtnText}>J'accepte les règles · Rejoindre</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRules(false)} style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textMuted }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  chatRoomAvatarPlaceholder: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  chatRoomName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  chatMemberCount: { color: COLORS.textMuted, fontSize: 11 },
  navIconBtn: { padding: 8 },
  emptyChatContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyChatText: { color: COLORS.textLight, fontSize: 15, fontWeight: '700', marginTop: 12 },
  emptyChatSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  msgRow: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 14 },
  msgBubbleOther: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, maxWidth: '85%' },
  msgText: { color: COLORS.textLight, fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  chatInput: { flex: 1, backgroundColor: COLORS.bgDark, color: COLORS.textLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, maxHeight: 90 },
  sendBtn: { backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  lockedBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.bgDark, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  lockedText: { color: COLORS.textMuted, fontSize: 13, flex: 1, fontWeight: '500' },
  lockJoinBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  lockJoinText: { color: 'white', fontWeight: '700', fontSize: 12 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  menuSheet: { position: 'absolute', right: 12, backgroundColor: COLORS.surfaceElevated, borderRadius: 12, padding: 6, minWidth: 180, borderWidth: 1, borderColor: COLORS.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8 },
  menuItemText: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surfaceElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30 },
  modalHandle: { width: 36, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: COLORS.textLight, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  rulesSubtitle: { color: COLORS.textMuted, fontSize: 13, marginBottom: 14 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ruleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 8 },
  ruleText: { color: COLORS.textLight, fontSize: 13 },
  acceptBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  acceptBtnText: { color: 'white', fontWeight: '700', fontSize: 14 }
});
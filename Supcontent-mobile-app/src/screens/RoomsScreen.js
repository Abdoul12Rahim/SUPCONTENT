import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { socialAPI } from '../services/api';

const COLORS = { primary: '#7c3aed', primaryLight: 'rgba(124,58,237,0.15)', bgDark: '#0d0d14', surface: '#13131f', surfaceElevated: '#1a1a2e', border: 'rgba(255,255,255,0.06)', textLight: '#f1f5f9', textMuted: '#64748b', accentGreen: '#10b981' };

const GAME_OPTIONS = [
  { id: '1', name: 'GTA VI', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Valorant', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Elden Ring', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&q=80' },
];

export default function RoomsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);

  const fetchRooms = async () => {
    try {
      const res = await socialAPI.getActiveRooms();
      setRooms(res.data || []);
    } catch (e) { console.log('Erreur fetchRooms:', e.message); }
  };

  useFocusEffect(useCallback(() => { fetchRooms(); }, []));

  const filteredRooms = rooms.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !selectedGame) return Alert.alert('Erreur', 'Jeu et nom requis.');
    try {
      await socialAPI.createRoom({ name: newRoomName.trim(), description: newRoomDesc.trim(), visibility: 'public', rules: "Respect exigé." });
      setShowCreateRoom(false);
      setNewRoomName(''); setNewRoomDesc(''); setSelectedGame(null);
      fetchRooms();
    } catch (e) { Alert.alert('Erreur', 'Création échouée.'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
      <View style={[styles.listHeader, { paddingTop: insets.top + 8 }]}>
        {showSearch ? (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
            <TextInput style={styles.searchInput} placeholder="Rechercher par jeu..." placeholderTextColor={COLORS.textMuted} value={searchQuery} onChangeText={setSearchQuery} autoFocus autoCapitalize="none" />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.listTitle}>Saloons</Text>
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

      <FlatList
        data={filteredRooms}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          //  C'EST ICI QU'ON NAVIGUE VERS LE NOUVEL ÉCRAN
          <TouchableOpacity style={styles.roomRow} activeOpacity={0.7} onPress={() => navigation.navigate('RoomChat', { room: item })}>
            <View style={styles.roomRowAvatarWrap}>
              <View style={styles.roomRowAvatarSubstitute}>
                <MaterialIcons name="sports-esports" size={24} color="white" />
              </View>
              <View style={[styles.roomRowDot, { backgroundColor: item.visibility === 'public' ? COLORS.accentGreen : COLORS.primary }]} />
            </View>
            <View style={styles.roomRowContent}>
              <View style={styles.roomRowTop}>
                <Text style={styles.roomRowName}>{item.name}</Text>
                <Text style={styles.roomRowTime}>Actif</Text>
              </View>
              <Text style={styles.roomRowLast} numberOfLines={1}>{item.description || 'Aucune description.'}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 84 }} />}
      />

      {/* Menu Haut */}
      <Modal visible={showTopMenu} animationType="fade" transparent>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowTopMenu(false)}>
          <View style={[styles.menuSheet, { top: insets.top + 50, right: 12 }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowTopMenu(false); setShowCreateRoom(true); }}>
              <MaterialIcons name="add" size={20} color={COLORS.textLight} />
              <Text style={styles.menuItemText}>Créer un saloon</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modale Création */}
      <Modal visible={showCreateRoom} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.modalSheet, { maxHeight: '92%' }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Créer un salon de jeu</Text>
              
              <Text style={styles.createLabel}>Attacher à un jeu vidéo *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {GAME_OPTIONS.map(game => (
                  <TouchableOpacity key={game.id} onPress={() => setSelectedGame(game)} style={[styles.gameOption, selectedGame?.id === game.id && { opacity: 1 }]}>
                    <Image source={{ uri: game.image }} style={[styles.gameOptionImg, selectedGame?.id === game.id && { borderColor: COLORS.primary }]} />
                    <Text style={styles.gameOptionName}>{game.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.createLabel}>Nom du salon *</Text>
              <TextInput style={styles.createInput} placeholder="Ex: FR - Valorant Compétitif" placeholderTextColor={COLORS.textMuted} value={newRoomName} onChangeText={setNewRoomName} />
              <Text style={styles.createLabel}>Description</Text>
              <TextInput style={[styles.createInput, { height: 70, textAlignVertical: 'top' }]} placeholder="Objectifs du groupe..." placeholderTextColor={COLORS.textMuted} value={newRoomDesc} onChangeText={setNewRoomDesc} multiline />

              <TouchableOpacity style={styles.acceptBtn} onPress={handleCreateRoom}>
                <Text style={styles.acceptBtnText}>Lancer le salon</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCreateRoom(false)} style={{ marginTop: 14, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bgDark },
  listTitle: { color: COLORS.textLight, fontSize: 24, fontWeight: '800' },
  listHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: { padding: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceElevated, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, color: COLORS.textLight, marginLeft: 6, fontSize: 13, paddingVertical: 2 },
  roomRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.bgDark },
  roomRowAvatarWrap: { position: 'relative', marginRight: 14 },
  roomRowAvatarSubstitute: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.surfaceElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  roomRowDot: { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: COLORS.bgDark },
  roomRowContent: { flex: 1 },
  roomRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roomRowName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  roomRowTime: { color: COLORS.textMuted, fontSize: 12 },
  roomRowLast: { color: COLORS.textMuted, fontSize: 13, marginRight: 8 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  menuSheet: { position: 'absolute', backgroundColor: COLORS.surfaceElevated, borderRadius: 12, padding: 6, minWidth: 180, borderWidth: 1, borderColor: COLORS.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8 },
  menuItemText: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surfaceElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30 },
  modalHandle: { width: 36, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: COLORS.textLight, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  acceptBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  acceptBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  createLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  createInput: { backgroundColor: COLORS.bgDark, color: COLORS.textLight, borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  gameOption: { alignItems: 'center', marginRight: 10, opacity: 0.6 },
  gameOptionImg: { width: 70, height: 70, borderRadius: 10, marginBottom: 4, borderWidth: 2, borderColor: 'transparent' },
  gameOptionName: { color: COLORS.textLight, fontSize: 10, fontWeight: '600' }
});
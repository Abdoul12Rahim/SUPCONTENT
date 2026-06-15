import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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

// 1. Ajout des catégories et enrichissement des jeux pour la démonstration
const CATEGORIES = ['Tous', 'Action', 'FPS', 'RPG'];
const GAME_OPTIONS = [
  { id: '1', name: 'GTA VI', category: 'Action', image: 'https://ui-avatars.com/api/?name=GTA+VI&background=7c3aed&color=fff&size=200' },
  { id: '2', name: 'Valorant', category: 'FPS', image: 'https://ui-avatars.com/api/?name=Valorant&background=ef4444&color=fff&size=200' },
  { id: '3', name: 'Elden Ring', category: 'RPG', image: 'https://ui-avatars.com/api/?name=Elden+Ring&background=10b981&color=fff&size=200' },
  { id: '4', name: 'Cyberpunk', category: 'RPG', image: 'https://ui-avatars.com/api/?name=Cyberpunk&background=f59e0b&color=fff&size=200' },
  { id: '5', name: 'Call of Duty', category: 'FPS', image: 'https://ui-avatars.com/api/?name=COD&background=3b82f6&color=fff&size=200' },
  { id: '6', name: 'Minecraft', category: 'Action', image: 'https://ui-avatars.com/api/?name=Minecraft&background=22c55e&color=fff&size=200' },
  { id: '7', name: 'LoL', category: 'Action', image: 'https://ui-avatars.com/api/?name=LoL&background=ec4899&color=fff&size=200' },
  { id: '8', name: 'Apex', category: 'FPS', image: 'https://ui-avatars.com/api/?name=Apex&background=f43f5e&color=fff&size=200' },
];

export default function RoomsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  
  // États de la modale de création
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await socialAPI.getActiveRooms();
      setRooms(res.data || []);
    } catch (e) {
      console.log('Erreur fetchRooms:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRooms();
  }, [fetchRooms]));

  const filteredRooms = rooms.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.linkedGame?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Le moteur de filtrage pour les jeux (Max 3 résultats)
const filteredGames = GAME_OPTIONS.filter(game => {
    const matchesCat = activeCategory === 'Tous' || game.category === activeCategory;
    const matchesSearch = game.name.toLowerCase().includes(gameSearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });
  const displayedGames = gameSearchQuery.trim() === '' ? filteredGames.slice(0, 3) : filteredGames;

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !selectedGame) {
      return Alert.alert('Erreur', 'Veuillez choisir un jeu et un nom de salon.');
    }
    
    setIsCreating(true);
    try {
      const payload = {
        name: newRoomName.trim(),
        description: newRoomDesc.trim(),
        linkedGame: {
          gameId: selectedGame.id.toString(),
          name: selectedGame.name,
          imageUrl: selectedGame.image
        }
      };

      await socialAPI.createRoom(payload);
      
      setShowCreateRoom(false);
      setNewRoomName(''); 
      setNewRoomDesc(''); 
      setSelectedGame(null);
      setGameSearchQuery('');
      setActiveCategory('Tous');
      
      Alert.alert('Succès', 'Salon créé avec succès!');
      fetchRooms();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Création échouée. Vérifiez votre connexion.');
      console.log("Erreur création:", e);
    } finally {
      setIsCreating(false);
    }
  };

  const getRoomIcon = (visibility) => visibility === 'public' ? 'public' : 'lock';
  const getRoomVisibilityColor = (visibility) => visibility === 'public' ? COLORS.accentGreen : COLORS.primary;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
      {/* HEADER EXISTANT */}
      <View style={[styles.listHeader, { paddingTop: insets.top + 8 }]}>
        {showSearch ? (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Rechercher par jeu, nom..." 
              placeholderTextColor={COLORS.textMuted} 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
              autoFocus 
              autoCapitalize="none" 
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
                <MaterialIcons name="add-circle-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* LISTE DES SALONS EXISTANTE */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="groups" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>{searchQuery ? 'Aucun salon trouvé' : 'Aucun salon disponible'}</Text>
          <Text style={styles.emptySub}>{searchQuery ? 'Essayez une autre recherche' : 'Crée le premier salon!'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.roomRow} 
              activeOpacity={0.7} 
              onPress={() => navigation.navigate('RoomChat', { room: item })}
            >
              <View style={styles.roomRowAvatarWrap}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.roomRowAvatar} />
                ) : (
                  <View style={styles.roomRowAvatarSubstitute}>
                    <MaterialIcons name="sports-esports" size={24} color="white" />
                  </View>
                )}
                <View style={[styles.roomRowDot, { backgroundColor: getRoomVisibilityColor(item.visibility) }]} />
              </View>

              <View style={styles.roomRowContent}>
                <View style={styles.roomRowTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roomRowName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.roomRowGame} numberOfLines={1}>
                      <MaterialIcons name="sports-esports" size={10} color={COLORS.textMuted} /> {item.linkedGame?.name || 'Jeu non spécifié'}
                    </Text>
                  </View>
                  <View style={styles.roomRowBadge}>
                    <MaterialIcons name={getRoomIcon(item.visibility)} size={12} color={getRoomVisibilityColor(item.visibility)} />
                  </View>
                </View>
                <View style={styles.roomRowBottom}>
                  <Text style={styles.roomRowDesc} numberOfLines={1}>
                    {item.description || 'Aucune description'}
                  </Text>
                  <Text style={styles.roomRowMembersCount}>
                    {item.members?.length || 0} membre{(item.members?.length || 0) > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 84 }} />}
        />
      )}

      {/* MENU TOP */}
      <Modal visible={showTopMenu} animationType="fade" transparent>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowTopMenu(false)}>
          <View style={[styles.menuSheet, { top: insets.top + 50, right: 12 }]}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { setShowTopMenu(false); setShowCreateRoom(true); }}
            >
              <MaterialIcons name="add" size={20} color={COLORS.primary} />
              <Text style={styles.menuItemText}>Créer un salon</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* NOUVELLE MODALE CRÉATION RÉPARÉE */}
      <Modal visible={showCreateRoom} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          {/* MaxHeight garanti que le clavier ne pousse pas la fenêtre hors de l'écran */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', maxHeight: '90%' }}>
            <View style={[styles.modalSheet, { flexShrink: 1 }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Créer un salon de jeu</Text>
              
              {/* C'est CE ScrollView qui répare ton bug. keyboardShouldPersistTaps permet de cliquer sur un jeu même si le clavier est ouvert */}
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                
                {/* --- ÉTAPE 1 : CHOIX DU JEU --- */}
                <Text style={styles.createLabel}>1. Choisir le jeu *</Text>
                
                {/* Barre de recherche du jeu */}
                <View style={styles.gameSearchBar}>
                  <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.gameSearchInput}
                    placeholder="Rechercher un jeu..."
                    placeholderTextColor={COLORS.textMuted}
                    value={gameSearchQuery}
                    onChangeText={setGameSearchQuery}
                  />
                </View>

                {/* Filtres Catégories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => setActiveCategory(cat)}
                      style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
                    >
                      <Text style={[styles.categoryPillText, activeCategory === cat && { color: 'white' }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

            
                {/* Liste des jeux */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {displayedGames.length > 0 ? displayedGames.map(game => (
                    <TouchableOpacity 
                      key={game.id} 
                      onPress={() => setSelectedGame(game)} 
                      style={[styles.gameOption, selectedGame?.id === game.id && styles.gameOptionSelected]}
                    >
                      <Image 
                        source={{ uri: game.image }} 
                        style={[styles.gameOptionImg, selectedGame?.id === game.id && { borderColor: COLORS.primary, borderWidth: 3 }]} 
                      />
                      <Text style={styles.gameOptionName} numberOfLines={1}>{game.name}</Text>
                    </TouchableOpacity>
                  )) : (
                    <Text style={{ color: COLORS.textMuted, fontStyle: 'italic', paddingVertical: 20 }}>Aucun jeu trouvé.</Text>
                  )}
                </ScrollView>

                {/* --- ÉTAPE 2 : INFOS DU SALON --- */}
                <Text style={styles.createLabel}>2. Nom du salon *</Text>
                <TextInput 
                  style={styles.createInput} 
                  placeholder="Ex: FR - Valorant Compétitif" 
                  placeholderTextColor={COLORS.textMuted} 
                  value={newRoomName} 
                  onChangeText={setNewRoomName}
                  editable={!isCreating}
                />

                <Text style={styles.createLabel}>Description</Text>
                <TextInput 
                  style={[styles.createInput, { height: 70, textAlignVertical: 'top' }]} 
                  placeholder="Objectifs du groupe, règles..." 
                  placeholderTextColor={COLORS.textMuted} 
                  value={newRoomDesc} 
                  onChangeText={setNewRoomDesc}
                  multiline
                  editable={!isCreating}
                />

                <TouchableOpacity 
                  style={[styles.acceptBtn, isCreating && { opacity: 0.6 }]} 
                  onPress={handleCreateRoom}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.acceptBtnText}>Lancer le salon</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setShowCreateRoom(false)} 
                  style={{ marginTop: 14, alignItems: 'center' }}
                  disabled={isCreating}
                >
                  <Text style={{ color: COLORS.textMuted }}>Annuler</Text>
                </TouchableOpacity>

              </ScrollView>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textLight, fontSize: 16, fontWeight: '700', marginTop: 16 },
  emptySub: { color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
  roomRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.bgDark },
  roomRowAvatarWrap: { position: 'relative', marginRight: 14 },
  roomRowAvatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: COLORS.border },
  roomRowAvatarSubstitute: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.surfaceElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  roomRowDot: { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: COLORS.bgDark },
  roomRowContent: { flex: 1 },
  roomRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  roomRowName: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  roomRowGame: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  roomRowBadge: { backgroundColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.primaryBorder },
  roomRowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomRowDesc: { color: COLORS.textMuted, fontSize: 13, flex: 1, marginRight: 8 },
  roomRowMembersCount: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500' },
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
  createLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 12 },
  createInput: { backgroundColor: COLORS.bgDark, color: COLORS.textLight, borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  gameOption: { alignItems: 'center', marginRight: 10, opacity: 0.6, width: 80 },
  gameOptionSelected: { opacity: 1 },
  gameOptionImg: { width: 70, height: 70, borderRadius: 10, marginBottom: 4, borderWidth: 2, borderColor: 'transparent' },
  gameOptionName: { color: COLORS.textLight, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  
  // --- NOUVEAUX STYLES POUR LA RECHERCHE ET LES CATÉGORIES ---
  gameSearchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgDark, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  gameSearchInput: { flex: 1, color: COLORS.textLight, marginLeft: 6, fontSize: 13 },
  categoryPill: { backgroundColor: COLORS.bgDark, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  categoryPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryPillText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' }
});
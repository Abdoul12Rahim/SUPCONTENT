import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Image, TouchableOpacity,
  Modal, Switch, Alert, Dimensions, Animated, PanResponder, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { libraryAPI, reviewAPI, userAPI, socialAPI, listAPI, authAPI } from '../services/api';
import GuestPrompt from '../components/GuestPrompt';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#7c3aed', primaryLight: 'rgba(124,58,237,0.15)',
  primaryBorder: 'rgba(124,58,237,0.25)', bgDark: '#0d0d14',
  surface: '#13131f', surfaceElevated: '#1a1a2e',
  border: 'rgba(255,255,255,0.06)', textLight: '#f1f5f9',
  textMuted: '#64748b', accentGreen: '#10b981', danger: '#ef4444',
};

export default function ProfileScreen({ navigation, route }) {
 /*
 Utuliser le code si vous n'arrive pas a vous connecter ou pour le développement du design, MAIS à retirer une fois que le design est validé pour tester avec les vraies données du contexte
  // 1. On récupère le contexte, MAIS on ne déstructure pas tout de suite
  const auth = useContext(AuthContext);
  
  // 2. LE COURT-CIRCUIT DE DÉVELOPPEMENT 
  // On force la connexion à "true"
  const isLoggedIn = true; 
  
  // On crée un faux utilisateur parfait pour tester ton design
  const user = auth.user || {
    username: "Alex Ducon",
    email: "contact@supinfo.com",
    bio: "Développeur Backend & Cloud",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&q=80"
  };

  // On récupère tes fonctions normales pour ne rien casser
  const logout = auth.logout;
  const updateUser = auth.updateUser;
*/
  
  const { isLoggedIn, user, logout, updateUser } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const isMyProfile = !route.params?.userId;

  const [activeTab, setActiveTab] = useState(0); // 0=bibliothèque, 1=listes
  const [isFollowing, setIsFollowing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [libraryPublic, setLibraryPublic] = useState(true);

  const [library, setLibrary] = useState([]);
  const [lists, setLists] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Swipe animation
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dy) < 30,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) switchTab(1);
        else if (g.dx > 50) switchTab(0);
      },
    })
  ).current;

  const switchTab = (index) => {
    setActiveTab(index);
    Animated.spring(translateX, {
      toValue: -index * width,
      useNativeDriver: true,
      tension: 100, friction: 12,
    }).start();
  };

  useEffect(() => {
    if (!isLoggedIn && isMyProfile) return;
    loadProfile();
  }, [route.params?.userId]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userId = route.params?.userId;
      if (isMyProfile) {
        const [libRes, listRes, reviewRes] = await Promise.allSettled([
          libraryAPI.getMyLibrary(),
          listAPI.getMyLists(),
          reviewAPI.getByUser(user._id),
        ]);
        if (libRes.status === 'fulfilled') setLibrary(libRes.value.data || []);
        if (listRes.status === 'fulfilled') setLists(listRes.value.data || []);
        if (reviewRes.status === 'fulfilled') setReviews(reviewRes.value.data || []);
      } else {
        const [profileRes, statsRes, reviewRes] = await Promise.allSettled([
          userAPI.getProfile(userId),
          userAPI.getStats(userId),
          reviewAPI.getByUser(userId),
        ]);
        if (profileRes.status === 'fulfilled') setProfileUser(profileRes.value.data);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (reviewRes.status === 'fulfilled') setReviews(reviewRes.value.data || []);
      }
    } catch (e) { console.log(e); } finally { setIsLoading(false); }
  };

  const handleFollow = async () => {
    const userId = route.params?.userId;
    try {
      if (isFollowing) await socialAPI.unfollowUser(userId);
      else await socialAPI.followUser(userId);
      setIsFollowing(!isFollowing);
    } catch (e) { console.log(e); }
  };

  const createList = async () => {
    Alert.prompt('Nouvelle liste', 'Nom de ta liste :', async (name) => {
      if (!name?.trim()) return;
      try {
        const res = await listAPI.create({ name: name.trim(), isPublic: false });
        setLists(prev => [res.data, ...prev]);
      } catch (e) { Alert.alert('Erreur', 'Impossible de créer la liste.'); }
    });
  };

  const deleteList = async (listId) => {
    Alert.alert('Supprimer', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await listAPI.delete(listId);
          setLists(prev => prev.filter(l => l._id !== listId));
        } catch (e) { console.log(e); }
      }}
    ]);
  };

  if (isMyProfile && !isLoggedIn) {
    return <GuestPrompt icon="person-outline" title="Rejoins la communauté" message="Connecte-toi pour accéder à ton profil." navigation={navigation} />;
  }

  const displayUser = isMyProfile ? user : profileUser;
  const playing = library.filter(g => g.status === 'playing');
  const completed = library.filter(g => g.status === 'completed');
  const wishlist = library.filter(g => g.status === 'wishlist');

  // ── SETTINGS MODAL ──
  const SettingsModal = () => (
    <Modal visible={showSettings} animationType="slide">
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
        <View style={[styles.settingsHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => { setSettingsSection(null); if (!settingsSection) setShowSettings(false); else setSettingsSection(null); }} style={{ padding: 8 }}>
            <MaterialIcons name="arrow-back" size={22} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.settingsTitle}>{settingsSection || 'Paramètres'}</Text>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {!settingsSection && (
            <>
              <Text style={styles.settingsCat}>Compte</Text>
              {[
                { icon: 'person', label: 'Informations du compte', section: 'Compte' },
                { icon: 'lock', label: 'Modifier le mot de passe', section: 'Mot de passe' },
                { icon: 'share', label: 'Partager mon profil', section: null, onPress: () => Alert.alert('Lien copié !') },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={styles.settingsItem} onPress={item.onPress || (() => item.section && setSettingsSection(item.section))}>
                  <MaterialIcons name={item.icon} size={20} color={COLORS.primary} />
                  <Text style={styles.settingsItemText}>{item.label}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}

              <Text style={styles.settingsCat}>Visibilité</Text>
              <View style={styles.settingsItem}>
                <MaterialIcons name="lock-outline" size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsItemText}>Compte privé</Text>
                  <Text style={styles.settingsItemSub}>Les abonnements nécessitent ton approbation</Text>
                </View>
                <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor="white" />
              </View>
              <View style={styles.settingsItem}>
                <MaterialIcons name="library-books" size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsItemText}>Bibliothèque publique</Text>
                </View>
                <Switch value={libraryPublic} onValueChange={setLibraryPublic} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor="white" />
              </View>
              <TouchableOpacity style={styles.settingsItem} onPress={() => setSettingsSection('Comptes bloqués')}>
                <MaterialIcons name="block" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Comptes bloqués</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.settingsCat}>Assistance</Text>
              {[
                { icon: 'help-outline', label: "Centre d'aide", section: 'Aide' },
                { icon: 'privacy-tip', label: 'Confidentialité', section: 'Confidentialité' },
                { icon: 'gavel', label: 'Conditions & Politique', section: 'Conditions' },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={styles.settingsItem} onPress={() => setSettingsSection(item.section)}>
                  <MaterialIcons name={item.icon} size={20} color={COLORS.primary} />
                  <Text style={styles.settingsItemText}>{item.label}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}

              <Text style={styles.settingsCat}>Connexion</Text>
              <TouchableOpacity style={styles.settingsItem} onPress={() => Alert.alert('Changer de compte', 'Fonctionnalité à venir.')}>
                <MaterialIcons name="swap-horiz" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Changer de compte</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem} onPress={() =>
                Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Déconnexion', style: 'destructive', onPress: () => { setShowSettings(false); logout(); } }
                ])
              }>
                <MaterialIcons name="logout" size={20} color={COLORS.danger} />
                <Text style={[styles.settingsItemText, { color: COLORS.danger }]}>Déconnexion</Text>
              </TouchableOpacity>
            </>
          )}

          {settingsSection === 'Compte' && (
            <View style={{ padding: 20 }}>
              {[
                { label: "Nom d'utilisateur", value: displayUser?.username },
                { label: 'Email', value: displayUser?.email },
                { label: 'Nom affiché', value: displayUser?.displayName },
              ].map((f, i) => (
                <View key={i}>
                  <Text style={styles.infoLabel}>{f.label}</Text>
                  <View style={styles.infoField}><Text style={styles.infoValue}>{f.value || '—'}</Text></View>
                </View>
              ))}
              <TouchableOpacity style={styles.saveBtn} onPress={() => Alert.alert('À venir', 'Modification du profil bientôt disponible.')}>
                <Text style={styles.saveBtnText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          )}

          {settingsSection === 'Conditions' && (
            <View style={{ padding: 20 }}>
              {['Règles de la communauté', 'Politique de confidentialité', "Conditions d'utilisation"].map((item, i) => (
                <TouchableOpacity key={i} style={styles.settingsItem}>
                  <MaterialIcons name="article" size={18} color={COLORS.primary} />
                  <Text style={styles.settingsItemText}>{item}</Text>
                  <MaterialIcons name="open-in-new" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {(settingsSection === 'Comptes bloqués' || settingsSection === 'Aide' || settingsSection === 'Confidentialité' || settingsSection === 'Mot de passe') && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textMuted }}>Section à venir.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
      <SettingsModal />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── PARTIE HAUTE ── */}
        <View style={styles.topSection}>
          {/* Bouton retour si visiteur */}
          {!isMyProfile && (
            <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
          )}

          {/* Banner */}
          <View style={[styles.banner, { paddingTop: insets.top }]} />

          {/* Avatar + actions haut */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: displayUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }}
                style={styles.avatar}
              />
              {isMyProfile && (
                <TouchableOpacity style={styles.avatarEditBtn}>
                  <MaterialIcons name="add-a-photo" size={13} color="white" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.topActions}>
              {isMyProfile ? (
                <TouchableOpacity onPress={() => { setSettingsSection(null); setShowSettings(true); }} style={styles.topActionBtn}>
                  <MaterialIcons name="more-horiz" size={22} color={COLORS.textLight} />
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={styles.topActionBtn} onPress={() => navigation.navigate('Messages', { userId: route.params.userId })}>
                    <MaterialIcons name="chat-bubble-outline" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.topActionBtn} onPress={() => Alert.alert('Partager', 'Lien copié !')}>
                    <MaterialIcons name="ios-share" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Nom + handle */}
          <View style={styles.nameBlock}>
            <Text style={styles.displayName}>{displayUser?.displayName || displayUser?.username || 'Joueur'}</Text>
            <Text style={styles.handle}>@{displayUser?.username || 'username'}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats?.followersCount ?? displayUser?.followersCount ?? 0}</Text>
              <Text style={styles.statLbl}>Abonnés</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats?.followingCount ?? displayUser?.followingCount ?? 0}</Text>
              <Text style={styles.statLbl}>Abonnements</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{reviews.length}</Text>
              <Text style={styles.statLbl}>Avis</Text>
            </View>
          </View>

          {/* Bio */}
          {displayUser?.bio ? (
            <Text style={styles.bio}>{displayUser.bio}</Text>
          ) : isMyProfile ? (
            <TouchableOpacity onPress={() => { setSettingsSection('Compte'); setShowSettings(true); }}>
              <Text style={[styles.bio, { color: COLORS.primary, fontStyle: 'italic' }]}>+ Ajouter une bio</Text>
            </TouchableOpacity>
          ) : null}

          {/* Follow button (visiteur) */}
          {!isMyProfile && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollow}
            >
              <MaterialIcons name={isFollowing ? 'check' : 'person-add'} size={18} color="white" />
              <Text style={styles.followBtnText}>{isFollowing ? 'Abonné' : 'Suivre'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── PARTIE BASSE — TABS + SWIPE ── */}
        <View style={styles.bottomSection}>
          {/* Tab headers */}
          <View style={styles.tabHeaders}>
            {['Bibliothèque', 'Listes'].map((label, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.tabHeader, activeTab === index && styles.tabHeaderActive]}
                onPress={() => switchTab(index)}
              >
                <Text style={[styles.tabHeaderText, activeTab === index && styles.tabHeaderTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Swipeable content */}
          <View style={{ overflow: 'hidden' }} {...panResponder.panHandlers}>
            <Animated.View style={{ flexDirection: 'row', width: width * 2, transform: [{ translateX }] }}>

              {/* ── PAGE 0 : BIBLIOTHÈQUE ── */}
              <View style={{ width }}>
                {isLoading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ margin: 30 }} />
                ) : (
                  <>
                    {[
                      { label: '🎮 En cours', data: playing },
                      { label: '✅ Terminés', data: completed },
                      { label: '⭐ Wishlist', data: wishlist },
                    ].map(({ label, data }) => data.length > 0 && (
                      <View key={label} style={{ marginBottom: 24 }}>
                        <Text style={styles.libSectionLabel}>{label} <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>({data.length})</Text></Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                          {data.map(item => (
                            <TouchableOpacity
                              key={item._id}
                              style={styles.gameCard}
                              onPress={() => navigation.navigate('GameDetail', { id: item.content?._id || item.contentId })}
                            >
                              <Image
                                source={{ uri: item.content?.backgroundImage || 'https://via.placeholder.com/110x150' }}
                                style={styles.gameCardImg}
                              />
                              <Text style={styles.gameCardTitle} numberOfLines={1}>
                                {item.content?.title || 'Jeu'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    ))}
                    {library.length === 0 && !isLoading && (
                      <View style={styles.emptyState}>
                        <MaterialIcons name="library-books" size={40} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Bibliothèque vide</Text>
                        <Text style={styles.emptySub}>Explore des jeux et ajoute-les à ta bibliothèque</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Games')}>
                          <Text style={styles.emptyBtnText}>Explorer les jeux</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* ── PAGE 1 : LISTES ── */}
              <View style={{ width }}>
                {isLoading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ margin: 30 }} />
                ) : (
                  <View style={{ padding: 16 }}>
                    {isMyProfile && (
                      <TouchableOpacity style={styles.createListBtn} onPress={createList}>
                        <MaterialIcons name="add" size={20} color={COLORS.primary} />
                        <Text style={styles.createListText}>Créer une liste</Text>
                      </TouchableOpacity>
                    )}
                    {lists.length === 0 ? (
                      <View style={styles.emptyState}>
                        <MaterialIcons name="playlist-add" size={40} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Aucune liste</Text>
                        <Text style={styles.emptySub}>Crée des listes pour organiser tes jeux</Text>
                      </View>
                    ) : lists.map(list => (
                      <TouchableOpacity key={list._id} style={styles.listCard}>
                        <View style={styles.listIconWrap}>
                          <MaterialIcons name="playlist-play" size={22} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listName}>{list.name}</Text>
                          <Text style={styles.listMeta}>
                            {list.items?.length || 0} jeu{(list.items?.length || 0) > 1 ? 'x' : ''} · {list.isPublic ? 'Public' : 'Privé'}
                          </Text>
                        </View>
                        {isMyProfile && (
                          <TouchableOpacity onPress={() => deleteList(list._id)} style={{ padding: 8 }}>
                            <MaterialIcons name="more-vert" size={20} color={COLORS.textMuted} />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

            </Animated.View>
          </View>

          {/* ── AVIS (toujours visible sous les tabs) ── */}
          {reviews.length > 0 && (
            <View style={{ padding: 16 }}>
              <Text style={styles.libSectionLabel}>Derniers avis</Text>
              {reviews.slice(0, 3).map(review => (
                <TouchableOpacity
                  key={review._id}
                  style={styles.reviewCard}
                  onPress={() => navigation.navigate('GameDetail', { id: review.content?._id })}
                >
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewGame}>{review.content?.title || 'Jeu'}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <MaterialIcons key={i} name={i <= review.rating ? 'star' : 'star-border'} size={13} color="#facc15" />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText} numberOfLines={2}>{review.text}</Text>
                  <Text style={styles.reviewDate}>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Top section
  topSection: { backgroundColor: COLORS.bgDark, paddingBottom: 20 },
  backBtn: { position: 'absolute', left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 20 },
  banner: { height: 130, backgroundColor: '#1a0a2e', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: -44 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.bgDark },
  avatarEditBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.bgDark },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  topActionBtn: { backgroundColor: COLORS.surface, padding: 9, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  nameBlock: { paddingHorizontal: 16, marginTop: 12 },
  displayName: { color: COLORS.textLight, fontSize: 22, fontWeight: '800' },
  handle: { color: COLORS.primary, fontSize: 13, fontWeight: '600', marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 14, marginBottom: 12 },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { color: COLORS.textLight, fontSize: 18, fontWeight: '800' },
  statLbl: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.border },
  bio: { color: COLORS.textMuted, paddingHorizontal: 16, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, marginHorizontal: 16, paddingVertical: 12, borderRadius: 14, gap: 8 },
  followingBtn: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  followBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  // Bottom section
  bottomSection: { backgroundColor: COLORS.bgDark },
  tabHeaders: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border },
  tabHeader: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderColor: 'transparent' },
  tabHeaderActive: { borderColor: COLORS.primary },
  tabHeaderText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
  tabHeaderTextActive: { color: COLORS.primary },
  // Library
  libSectionLabel: { color: COLORS.textLight, fontWeight: '700', fontSize: 15, paddingHorizontal: 16, marginBottom: 12, marginTop: 20 },
  gameCard: { marginRight: 12, width: 110 },
  gameCardImg: { width: 110, height: 150, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  gameCardTitle: { color: COLORS.textLight, fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textLight, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 16 },
  emptyBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  // Lists
  createListBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primaryBorder },
  createListText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  listIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder },
  listName: { color: COLORS.textLight, fontWeight: '700', fontSize: 14 },
  listMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
  // Reviews
  reviewCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewGame: { color: COLORS.textLight, fontWeight: '700', fontSize: 14 },
  reviewText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  reviewDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 6 },
  // Settings
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingsTitle: { color: COLORS.textLight, fontSize: 17, fontWeight: '700' },
  settingsCat: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingsItemText: { color: COLORS.textLight, fontSize: 15, fontWeight: '500', flex: 1 },
  settingsItemSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  infoLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 16 },
  infoField: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  infoValue: { color: COLORS.textLight, fontSize: 14 },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
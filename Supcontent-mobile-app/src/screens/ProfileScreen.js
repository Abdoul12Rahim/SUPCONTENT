import React, { useState, useRef, useContext, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Image, TouchableOpacity,
  Modal, Switch, Alert, Dimensions, Animated, PanResponder,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
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
  const { isLoggedIn, user, logout, updateUser } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const isMyProfile = !route.params?.userId;

  const [activeTab, setActiveTab] = useState(0);
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

  // Edit profile state
  const [showEditBio, setShowEditBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [displayNameText, setDisplayNameText] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Create list state
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

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

  // Recharge à chaque fois qu'on revient sur la page
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn && isMyProfile) return;
      loadProfile();
    }, [route.params?.userId, isLoggedIn])
  );

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userId = route.params?.userId;
      if (isMyProfile) {
        const results = await Promise.allSettled([
          libraryAPI.getMyLibrary(),
          listAPI.getMyLists(),
          reviewAPI.getByUser(user._id),
        ]);

        const libRes = results[0];
        const listRes = results[1];
        const reviewRes = results[2];

        if (libRes.status === 'fulfilled') {
          const raw = libRes.value.data;
          const list = Array.isArray(raw) ? raw : raw?.library || raw?.items || raw?.data || [];
          setLibrary(list);
        } else { setLibrary([]); }

        if (listRes.status === 'fulfilled') {
          const raw = listRes.value.data;
          const list = Array.isArray(raw) ? raw : raw?.lists || raw?.data || [];
          setLists(list);
        } else { setLists([]); }

        if (reviewRes.status === 'fulfilled') {
          const raw = reviewRes.value.data;
          const list = Array.isArray(raw) ? raw : raw?.reviews || raw?.data || [];
          setReviews(list);
        } else { setReviews([]); }

      } else {
        const results = await Promise.allSettled([
          userAPI.getProfile(userId),
          userAPI.getStats(userId),
          reviewAPI.getByUser(userId),
        ]);

        const profileRes = results[0];
        const statsRes = results[1];
        const reviewRes = results[2];

        if (profileRes.status === 'fulfilled') {
          const raw = profileRes.value.data;
          setProfileUser(raw?.user || raw);
        }
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (reviewRes.status === 'fulfilled') {
          const raw = reviewRes.value.data;
          const list = Array.isArray(raw) ? raw : raw?.reviews || raw?.data || [];
          setReviews(list);
        } else { setReviews([]); }
      }
    } catch (e) {
      console.log('Erreur loadProfile:', e.message);
      setLibrary([]); setLists([]); setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    const userId = route.params?.userId;
    try {
      if (isFollowing) await socialAPI.unfollowUser(userId);
      else await socialAPI.followUser(userId);
      setIsFollowing(!isFollowing);
    } catch (e) { console.log(e); }
  };

  // ── PHOTO DE PROFIL ──
const handleChangeAvatar = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorise l\'accès à ta galerie dans les paramètres.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const uri = result.assets[0].uri;

    
    await updateUser({ ...user, avatar: uri });

    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });

      const res = await userAPI.uploadAvatar(formData);

      const BASE_URL = 'https://supcontent-production.up.railway.app';
      const rawAvatar =
        res.data?.avatar ||
        res.data?.url ||
        res.data?.user?.avatar ||
        null;

      const serverAvatar = rawAvatar
        ? rawAvatar.startsWith('http')
          ? rawAvatar
          : `${BASE_URL}${rawAvatar}`
        : uri;

      await updateUser({ ...user, avatar: serverAvatar });
      Alert.alert('✅ Photo mise à jour !');
    } catch (e) {
      console.log('❌ Erreur upload:', e.response?.data || e.message);
      Alert.alert('✅ Photo enregistrée localement.');
    }
  } catch (e) {
    console.log('❌ Erreur ImagePicker:', e.message);
    Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie.');
  }
};

  // ── BIO + NOM ──
  const openEditBio = () => {
    setBioText(user?.bio || '');
    setDisplayNameText(user?.displayName || user?.username || '');
    setShowEditBio(true);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await authAPI.updateProfile({
        bio: bioText.trim(),
        displayName: displayNameText.trim(),
      });
      const updated = res.data?.user || res.data;
      updateUser({ ...user, bio: updated.bio, displayName: updated.displayName });
      setShowEditBio(false);
      Alert.alert('✅ Profil mis à jour !');
    } catch (e) {
      console.log('Erreur updateProfile:', e.response?.data);
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible de mettre à jour.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── MOT DE PASSE ──
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Champs manquants', 'Remplis tous les champs.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setIsChangingPw(true);
    try {
      await authAPI.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
      setSettingsSection(null);
      Alert.alert('✅ Mot de passe modifié !', 'Ton mot de passe a été mis à jour.');
    } catch (e) {
      console.log('Erreur changePassword:', e.response?.data);
      Alert.alert('Erreur', e.response?.data?.message || 'Mot de passe actuel incorrect.');
    } finally {
      setIsChangingPw(false);
    }
  };

  // ── CRÉER UNE LISTE ──
  const createList = async () => {
    if (!newListName.trim()) return;
    setIsCreatingList(true);
    try {
      const res = await listAPI.create({ name: newListName.trim(), isPublic: false });
      const raw = res.data;
      const newList = raw?.list || raw;
      setLists(prev => [newList, ...prev]);
      setNewListName('');
      setShowCreateList(false);
    } catch (e) {
      console.log('Erreur createList:', e.response?.data);
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible de créer la liste.');
    } finally {
      setIsCreatingList(false);
    }
  };

  const deleteList = async (listId) => {
    Alert.alert('Supprimer', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await listAPI.delete(listId);
            setLists(prev => prev.filter(l => l._id !== listId));
          } catch (e) { console.log(e); }
        }
      }
    ]);
  };

  if (isMyProfile && !isLoggedIn) {
    return <GuestPrompt icon="person-outline" title="Rejoins la communauté" message="Connecte-toi pour accéder à ton profil." navigation={navigation} />;
  }

  const displayUser = isMyProfile ? user : profileUser;
  const safeLibrary = Array.isArray(library) ? library : [];
  const playing = safeLibrary.filter(g => g.status === 'playing');
  const completed = safeLibrary.filter(g => g.status === 'completed');
  const wishlist = safeLibrary.filter(g => g.status === 'wishlist');
  const dropped = safeLibrary.filter(g => g.status === 'dropped');

  // ── SETTINGS MODAL ──
  const SettingsModal = () => (
    <Modal visible={showSettings} animationType="slide">
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
        <View style={[styles.settingsHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => {
              if (settingsSection) setSettingsSection(null);
              else setShowSettings(false);
            }}
            style={{ padding: 8 }}
          >
            <MaterialIcons name="arrow-back" size={22} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.settingsTitle}>{settingsSection || 'Paramètres'}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>

          {/* ── MENU PRINCIPAL ── */}
          {!settingsSection && (
            <>
              <Text style={styles.settingsCat}>Compte</Text>
              <TouchableOpacity style={styles.settingsItem} onPress={() => setSettingsSection('Compte')}>
                <MaterialIcons name="person" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Informations du compte</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem} onPress={() => setSettingsSection('Mot de passe')}>
                <MaterialIcons name="lock" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Modifier le mot de passe</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem} onPress={() => Alert.alert('Lien copié !', 'Ton lien de profil a été copié.')}>
                <MaterialIcons name="share" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Partager mon profil</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>

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
                  <Text style={styles.settingsItemSub}>Les visiteurs peuvent voir tes jeux</Text>
                </View>
                <Switch value={libraryPublic} onValueChange={setLibraryPublic} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor="white" />
              </View>
              <TouchableOpacity style={styles.settingsItem} onPress={() => setSettingsSection('Comptes bloqués')}>
                <MaterialIcons name="block" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Comptes bloqués</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.settingsCat}>Assistance</Text>
              <TouchableOpacity style={styles.settingsItem} onPress={() => setSettingsSection('Aide')}>
                <MaterialIcons name="help-outline" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Centre d'aide</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem} onPress={() => setSettingsSection('Confidentialité')}>
                <MaterialIcons name="privacy-tip" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Confidentialité</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem} onPress={() => setSettingsSection('Conditions')}>
                <MaterialIcons name="gavel" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Conditions & Politique</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.settingsCat}>Connexion</Text>
              <TouchableOpacity style={styles.settingsItem} onPress={() => Alert.alert('Changer de compte', 'Fonctionnalité à venir.')}>
                <MaterialIcons name="swap-horiz" size={20} color={COLORS.primary} />
                <Text style={styles.settingsItemText}>Changer de compte</Text>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Déconnexion', style: 'destructive', onPress: () => { setShowSettings(false); logout(); } }
                ])}
              >
                <MaterialIcons name="logout" size={20} color={COLORS.danger} />
                <Text style={[styles.settingsItemText, { color: COLORS.danger }]}>Déconnexion</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── INFOS COMPTE ── */}
          {settingsSection === 'Compte' && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={{ padding: 20 }}>
                <Text style={styles.infoLabel}>Nom affiché</Text>
                <TextInput
                  style={styles.infoInput}
                  value={displayNameText}
                  onChangeText={setDisplayNameText}
                  placeholder="Ton nom affiché"
                  placeholderTextColor={COLORS.textMuted}
                  defaultValue={displayUser?.displayName || displayUser?.username}
                  onFocus={() => setDisplayNameText(displayUser?.displayName || displayUser?.username || '')}
                />
                <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
                <View style={styles.infoField}>
                  <Text style={styles.infoValue}>{displayUser?.username || '—'}</Text>
                </View>
                <Text style={styles.infoLabel}>Email</Text>
                <View style={styles.infoField}>
                  <Text style={styles.infoValue}>{displayUser?.email || '—'}</Text>
                </View>
                <Text style={styles.infoLabel}>Bio</Text>
                <TextInput
                  style={[styles.infoInput, { height: 100, textAlignVertical: 'top' }]}
                  value={bioText}
                  onChangeText={setBioText}
                  placeholder="Parle de toi..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  defaultValue={displayUser?.bio}
                  onFocus={() => setBioText(displayUser?.bio || '')}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, isSavingProfile && { opacity: 0.6 }]}
                  onPress={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.saveBtnText}>Enregistrer</Text>
                  }
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* ── MOT DE PASSE ── */}
          {settingsSection === 'Mot de passe' && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={{ padding: 20 }}>
                <Text style={styles.infoLabel}>Mot de passe actuel</Text>
                <View style={styles.pwInputWrap}>
                  <TextInput
                    style={styles.pwInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showCurrentPw}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)}>
                    <MaterialIcons name={showCurrentPw ? 'visibility' : 'visibility-off'} size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.infoLabel}>Nouveau mot de passe</Text>
                <View style={styles.pwInputWrap}>
                  <TextInput
                    style={styles.pwInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Minimum 6 caractères"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showNewPw}
                  />
                  <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                    <MaterialIcons name={showNewPw ? 'visibility' : 'visibility-off'} size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.infoLabel}>Confirmer le nouveau mot de passe</Text>
                <View style={styles.pwInputWrap}>
                  <TextInput
                    style={styles.pwInput}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showNewPw}
                  />
                </View>

                {newPassword.length > 0 && newPassword !== confirmNewPassword && (
                  <Text style={{ color: COLORS.danger, fontSize: 12, marginBottom: 12 }}>
                    Les mots de passe ne correspondent pas
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.saveBtn, (isChangingPw || !currentPassword || !newPassword || newPassword !== confirmNewPassword) && { opacity: 0.4 }]}
                  onPress={handleChangePassword}
                  disabled={isChangingPw || !currentPassword || !newPassword || newPassword !== confirmNewPassword}
                >
                  {isChangingPw
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.saveBtnText}>Changer le mot de passe</Text>
                  }
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* ── CONDITIONS ── */}
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

          {/* ── SECTIONS À VENIR ── */}
          {(settingsSection === 'Comptes bloqués' || settingsSection === 'Aide' || settingsSection === 'Confidentialité') && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <MaterialIcons name="construction" size={40} color={COLORS.textMuted} />
              <Text style={{ color: COLORS.textMuted, marginTop: 12, textAlign: 'center' }}>Section à venir.</Text>
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
          {!isMyProfile && (
            <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
          )}

          <View style={[styles.banner, { paddingTop: insets.top }]} />

          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              {displayUser?.avatar ? (
                <Image source={{ uri: displayUser.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={44} color={COLORS.primary} />
                </View>
              )}
              {isMyProfile && (
                <TouchableOpacity style={styles.avatarEditBtn} onPress={handleChangeAvatar}>
                  <MaterialIcons name="add-a-photo" size={13} color="white" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.topActions}>
              {isMyProfile ? (
                <TouchableOpacity
                  onPress={() => { setSettingsSection(null); setShowSettings(true); }}
                  style={styles.topActionBtn}
                >
                  <MaterialIcons name="more-horiz" size={22} color={COLORS.textLight} />
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={styles.topActionBtn}
                    onPress={() => navigation.navigate('Messages', { userId: route.params?.userId })}
                  >
                    <MaterialIcons name="chat-bubble-outline" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.topActionBtn} onPress={() => Alert.alert('Partager', 'Lien copié !')}>
                    <MaterialIcons name="ios-share" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.nameBlock}>
            <Text style={styles.displayName}>{displayUser?.displayName || displayUser?.username || 'Joueur'}</Text>
            <Text style={styles.handle}>@{displayUser?.username || 'username'}</Text>
          </View>

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

          {/* BIO */}
          {displayUser?.bio ? (
            <TouchableOpacity onPress={isMyProfile ? openEditBio : undefined}>
              <Text style={styles.bio}>{displayUser.bio}</Text>
              {isMyProfile && (
                <Text style={{ color: COLORS.primary, fontSize: 12, paddingHorizontal: 16, marginTop: 2 }}>
                  Modifier la bio
                </Text>
              )}
            </TouchableOpacity>
          ) : isMyProfile ? (
            <TouchableOpacity onPress={openEditBio} style={styles.addBioBtn}>
              <MaterialIcons name="edit" size={16} color={COLORS.primary} />
              <Text style={styles.addBioText}>+ Ajouter une bio</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.bio, { fontStyle: 'italic' }]}>Aucune bio.</Text>
          )}

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

        {/* ── TABS + SWIPE ── */}
        <View style={styles.bottomSection}>
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

          <View style={{ overflow: 'hidden' }} {...panResponder.panHandlers}>
            <Animated.View style={{ flexDirection: 'row', width: width * 2, transform: [{ translateX }] }}>

              {/* ── PAGE 0 : BIBLIOTHÈQUE ── */}
              <View style={{ width }}>
                {isLoading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ margin: 30 }} />
                ) : safeLibrary.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="library-books" size={40} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>Bibliothèque vide</Text>
                    <Text style={styles.emptySub}>Explore des jeux et ajoute-les à ta bibliothèque</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Games')}>
                      <Text style={styles.emptyBtnText}>Explorer les jeux</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  [
                    { label: '🎮 En cours', data: playing },
                    { label: '✅ Terminés', data: completed },
                    { label: '⭐ Wishlist', data: wishlist },
                    { label: '❌ Abandonnés', data: dropped },
                  ].map(({ label, data }) => data.length > 0 && (
                    <View key={label} style={{ marginBottom: 24 }}>
                      <Text style={styles.libSectionLabel}>
                        {label} <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>({data.length})</Text>
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {data.map(item => (
                          <TouchableOpacity
                            key={item._id}
                            style={styles.gameCard}
                            onPress={() => navigation.navigate('GameDetail', {
                              id: item.content?.externalId || item.contentId || item.content?._id,
                            })}
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
                  ))
                )}
              </View>

              {/* ── PAGE 1 : LISTES ── */}
              <View style={{ width }}>
                {isLoading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ margin: 30 }} />
                ) : (
                  <View style={{ padding: 16 }}>
                    {isMyProfile && (
                      <TouchableOpacity style={styles.createListBtn} onPress={() => setShowCreateList(true)}>
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
                            <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          {/* ── AVIS ── */}
          {reviews.length > 0 && (
            <View style={{ padding: 16 }}>
              <Text style={styles.libSectionLabel}>Derniers avis</Text>
              {reviews.slice(0, 3).map(review => (
                <TouchableOpacity
                  key={review._id}
                  style={styles.reviewCard}
                  onPress={() => navigation.navigate('GameDetail', { id: review.content?.externalId || review.content?._id })}
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
                  <Text style={styles.reviewDate}>
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── MODAL EDIT BIO ── */}
      <Modal visible={showEditBio} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <Text style={styles.infoLabel}>Nom affiché</Text>
              <TextInput
                style={styles.modalInput}
                value={displayNameText}
                onChangeText={setDisplayNameText}
                placeholder="Ton nom affiché"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.infoLabel}>Bio</Text>
              <TextInput
                style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                value={bioText}
                onChangeText={setBioText}
                placeholder="Parle de toi en quelques mots..."
                placeholderTextColor={COLORS.textMuted}
                multiline
              />
              <TouchableOpacity
                style={[styles.saveBtn, isSavingProfile && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.saveBtnText}>Enregistrer</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowEditBio(false)}
                style={[styles.cancelBtn, { marginTop: 10 }]}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── MODAL CRÉER LISTE ── */}
      <Modal visible={showCreateList} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Nouvelle liste</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nom de ta liste..."
                placeholderTextColor={COLORS.textMuted}
                value={newListName}
                onChangeText={setNewListName}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.saveBtn, (!newListName.trim() || isCreatingList) && { opacity: 0.4 }]}
                onPress={createList}
                disabled={!newListName.trim() || isCreatingList}
              >
                {isCreatingList
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.saveBtnText}>Créer</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowCreateList(false); setNewListName(''); }}
                style={[styles.cancelBtn, { marginTop: 10 }]}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: { backgroundColor: COLORS.bgDark, paddingBottom: 20 },
  backBtn: { position: 'absolute', left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 20 },
  banner: { height: 130, backgroundColor: '#1a0a2e', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: -44 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.bgDark },
  avatarPlaceholder: { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primaryBorder },
  avatarEditBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.bgDark },
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
  bio: { color: COLORS.textMuted, paddingHorizontal: 16, fontSize: 13, lineHeight: 20, marginBottom: 4 },
  addBioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 12 },
  addBioText: { color: COLORS.primary, fontSize: 13, fontWeight: '600', fontStyle: 'italic' },
  followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, marginHorizontal: 16, marginTop: 12, paddingVertical: 12, borderRadius: 14, gap: 8 },
  followingBtn: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  followBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  bottomSection: { backgroundColor: COLORS.bgDark },
  tabHeaders: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border },
  tabHeader: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderColor: 'transparent' },
  tabHeaderActive: { borderColor: COLORS.primary },
  tabHeaderText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
  tabHeaderTextActive: { color: COLORS.primary },
  libSectionLabel: { color: COLORS.textLight, fontWeight: '700', fontSize: 15, paddingHorizontal: 16, marginBottom: 12, marginTop: 20 },
  gameCard: { marginRight: 12, width: 110 },
  gameCardImg: { width: 110, height: 150, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  gameCardTitle: { color: COLORS.textLight, fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textLight, fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 16 },
  emptyBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  createListBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primaryBorder },
  createListText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  listIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder },
  listName: { color: COLORS.textLight, fontWeight: '700', fontSize: 14 },
  listMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
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
  infoLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 16, paddingHorizontal: 0 },
  infoField: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  infoValue: { color: COLORS.textLight, fontSize: 14 },
  infoInput: { backgroundColor: COLORS.surface, color: COLORS.textLight, borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  pwInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  pwInput: { flex: 1, color: COLORS.textLight, fontSize: 14, paddingVertical: 14 },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surfaceElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.textLight, fontSize: 20, fontWeight: '800', marginBottom: 16 },
  modalInput: { backgroundColor: COLORS.bgDark, color: COLORS.textLight, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  cancelBtn: { backgroundColor: COLORS.surface, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
});
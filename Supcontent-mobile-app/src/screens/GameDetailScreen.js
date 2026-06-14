import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView,
  Platform, Alert, Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { reviewAPI, libraryAPI, listAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const RAWG_API_KEY = process.env.EXPO_PUBLIC_RAWG_API_KEY;

const COLORS = {
  primary: '#7c3aed', primaryLight: 'rgba(124,58,237,0.15)',
  bgDark: '#0d0d14', surface: '#13131f', surfaceElevated: '#1a1a2e',
  border: 'rgba(255,255,255,0.06)', textLight: '#f1f5f9',
  textMuted: '#64748b', accentGreen: '#10b981', danger: '#ef4444',
};

// Nettoie le HTML des descriptions RAWG
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
};

// Traduit les descriptions en français via LibreTranslate (gratuit)
const translateToFrench = async (text) => {
  if (!text) return '';
  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text.slice(0, 1000), // limite pour éviter timeout
        source: 'en',
        target: 'fr',
        format: 'text',
      }),
    });
    const data = await response.json();
    return data.translatedText || text;
  } catch {
    return text; // si échec → garde l'original
  }
};

export default function GameDetailScreen({ route, navigation }) {
  const { id, gameId } = route.params || {};
  const finalId = id || gameId;
  const { isLoggedIn, user } = useContext(AuthContext);

  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalDesc, setOriginalDesc] = useState('');

  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myReview, setMyReview] = useState(null);

  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [myLists, setMyLists] = useState([]);
  const [inLibrary, setInLibrary] = useState(false);
  const [libraryStatus, setLibraryStatus] = useState(null);
  const [isAddingToLib, setIsAddingToLib] = useState(false);

  useEffect(() => {
    if (!finalId) { setIsLoading(false); return; }
    loadAll();
  }, [finalId]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      // 1. Données RAWG
      const response = await fetch(
        `https://api.rawg.io/api/games/${finalId}?key=${RAWG_API_KEY}`
      );
      const data = await response.json();
      setGame(data);

      // Description nettoyée
      const cleaned = stripHtml(data.description_raw || data.description || '');
      setOriginalDesc(cleaned);
      setDescription(cleaned);

      // 2. Reviews backend
      try {
        const reviewRes = await reviewAPI.getByGame(finalId);
        const raw = reviewRes.data;
        const list = Array.isArray(raw) ? raw : raw?.reviews || raw?.data || [];
        setReviews(list);
      } catch { setReviews([]); }

      // 3. Si connecté → check bibliothèque + ma review + mes listes
      if (isLoggedIn) {
        try {
          const [libCheck, myReviewRes, listsRes] = await Promise.allSettled([
            libraryAPI.checkInLibrary(finalId),
            reviewAPI.getMyReviewForGame(finalId),
            listAPI.getMyLists(),
          ]);

if (libCheck.status === 'fulfilled' && libCheck.value.data) {
            const data = libCheck.value.data;

            if (data.inLibrary || data.status) {
              setInLibrary(true);
              setLibraryStatus(data.status || 'playing');
            } else {
              setInLibrary(false);
              setLibraryStatus(null);
            }
          }
          if (myReviewRes.status === 'fulfilled' && myReviewRes.value.data) {
            setMyReview(myReviewRes.value.data);
            setUserRating(myReviewRes.value.data.rating || 0);
            setReviewText(myReviewRes.value.data.text || '');
          }
          if (listsRes.status === 'fulfilled') {
            const raw = listsRes.value.data;
            setMyLists(Array.isArray(raw) ? raw : raw?.lists || raw?.data || []);
          }
        } catch (e) { console.log('Erreur check lib:', e.message); }
      }

    } catch (error) {
      console.log('Erreur loadAll:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (isTranslated) {
      setDescription(originalDesc);
      setIsTranslated(false);
      return;
    }
    setIsTranslating(true);
    const translated = await translateToFrench(originalDesc);
    setDescription(translated);
    setIsTranslated(true);
    setIsTranslating(false);
  };

  const handleAddToLibrary = async (status) => {
  if (!isLoggedIn) {
    Alert.alert('Connexion requise', 'Connecte-toi pour ajouter à ta bibliothèque.');
    navigation.navigate('Login');
    return;
  }
  setIsAddingToLib(true);
  setShowLibraryModal(false); 
  try {
    await libraryAPI.addGame({ contentId: String(finalId), status });
    setInLibrary(true);
    setLibraryStatus(status);
    Alert.alert(' Ajouté !', `${game?.name} ajouté à ta bibliothèque.`);
  } catch (e) {
    console.log('Erreur addGame:', e.response?.data);
    // Si déjà dans la biblio → on met juste à jour le status
    if (e.response?.status === 400 || e.response?.status === 409) {
      setInLibrary(true);
      setLibraryStatus(status);
    } else {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible d\'ajouter.');
    }
  } finally {
    setIsAddingToLib(false);
  }
};

 const handleRemoveFromLibrary = async () => {
  Alert.alert('Retirer', 'Retirer ce jeu de ta bibliothèque ?', [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Retirer', style: 'destructive', onPress: async () => {
        try {
          await libraryAPI.removeGame(String(finalId));
          setInLibrary(false);
          setLibraryStatus(null);
          Alert.alert('Retiré', 'Jeu retiré de ta bibliothèque.');
        } catch (e) {
          console.log('Erreur remove:', e.response?.data);
          Alert.alert('Erreur', 'Impossible de retirer ce jeu.');
        }
      }
    }
  ]);
};

  const handleAddToList = async (listId) => {
    try {
      await listAPI.addItem(listId, { contentId: finalId });
      setShowListModal(false);
      Alert.alert('✅ Ajouté !', 'Jeu ajouté à la liste.');
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible d\'ajouter.');
    }
  };

 // Remplace handleSubmitReview par :
const handleSubmitReview = async () => {
  if (!isLoggedIn) {
    Alert.alert('Connexion requise', 'Connecte-toi pour laisser un avis.');
    navigation.navigate('Login');
    return;
  }
  if (!reviewText.trim() || userRating === 0) {
    Alert.alert('Incomplet', 'Ajoute une note et un commentaire.');
    return;
  }
  setIsSubmitting(true);
  try {
    const res = await reviewAPI.create({
      contentId: String(finalId),
      rating: userRating,
      text: reviewText.trim(),
    });
    const newReview = res.data;
    // Recharge toutes les reviews depuis le backend
    const reviewRes = await reviewAPI.getByGame(String(finalId));
    const raw = reviewRes.data;
    const list = Array.isArray(raw) ? raw : raw?.reviews || raw?.data || [];
    setReviews(list);
    setMyReview(newReview);
    setReviewText('');
    setUserRating(0);
    Alert.alert(' Publié !', 'Ton avis a été publié.');
  } catch (e) {
    console.log('Erreur review:', e.response?.data);
    Alert.alert('Erreur', e.response?.data?.message || 'Impossible de publier.');
  } finally {
    setIsSubmitting(false);
  }
};

  const getStatusLabel = (status) => {
    const map = { playing: ' En cours', completed: ' Terminé', to_play: ' Wishlist', dropped: ' Abandonné' };
    return map[status] || status;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!game || game.detail === 'Not found.') {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.textMuted} />
        <Text style={{ color: COLORS.textLight, fontSize: 16, marginTop: 12 }}>Jeu introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* NAV */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <MaterialIcons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{game.name || game.title}</Text>
          <TouchableOpacity style={styles.navBtn}>
            <MaterialIcons name="ios-share" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* HERO */}
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: game.background_image || 'https://via.placeholder.com/800x400' }}
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay}>
              <View style={styles.heroBottom}>
                <View style={{ flex: 1 }}>
                  {game.rating > 4.5 && (
                    <View style={styles.topRatedBadge}>
                      <Text style={styles.topRatedText}>⭐ Top Rated</Text>
                    </View>
                  )}
                  <Text style={styles.heroTitle} numberOfLines={2}>{game.name}</Text>
                </View>
                <View style={styles.ratingBox}>
                  <Text style={styles.ratingLabel}>NOTE</Text>
                  <Text style={styles.ratingValue}>
                    {game.rating ? parseFloat(game.rating).toFixed(1) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* GENRES + ANNÉE */}
          <View style={styles.section}>
            <Text style={styles.genreText}>
              {game.genres?.map(g => g.name).join(' · ') || 'Action'}
              {game.released ? `  ·  ${game.released.substring(0, 4)}` : ''}
            </Text>

            {/* PLATEFORMES */}
            {game.platforms && game.platforms.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {game.platforms.slice(0, 6).map(({ platform }) => (
                  <View key={platform.id} style={styles.platformTag}>
                    <Text style={styles.platformTagText}>{platform.name}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* DESCRIPTION */}
            {description ? (
              <>
                <Text style={styles.description}>{description}</Text>
                <TouchableOpacity style={styles.translateBtn} onPress={handleTranslate} disabled={isTranslating}>
                  {isTranslating ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <MaterialIcons name="translate" size={16} color={COLORS.primary} />
                      <Text style={styles.translateBtnText}>
                        {isTranslated ? 'Voir en anglais' : 'Traduire en français'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.description}>Aucune description disponible.</Text>
            )}

            {/* BOUTONS ACTION */}
            <View style={styles.actionRow}>
              {/* Ajouter à bibliothèque */}
              {inLibrary ? (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', flex: 1 }]}
                  onPress={handleRemoveFromLibrary}
                >
                  <MaterialIcons name="check-circle" size={18} color={COLORS.accentGreen} />
                  <Text style={[styles.actionBtnText, { color: COLORS.accentGreen }]}>
                    {getStatusLabel(libraryStatus)}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: COLORS.primary, flex: 1 }]}
                  onPress={() => {
                    if (!isLoggedIn) { Alert.alert('Connexion requise', 'Connecte-toi pour ajouter à ta bibliothèque.'); return; }
                    setShowLibraryModal(true);
                  }}
                >
                  <MaterialIcons name="add-photo-alternate" size={18} color="white" />
                  <Text style={[styles.actionBtnText, { color: 'white' }]}>Ajouter à ma galerie</Text>
                </TouchableOpacity>
              )}

              {/* Ajouter à une liste */}
              {isLoggedIn && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}
                  onPress={() => setShowListModal(true)}
                >
                  <MaterialIcons name="playlist-add" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* REVIEWS */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Avis & Notes</Text>
              <View style={styles.globalRating}>
                <MaterialIcons name="star" size={16} color="#facc15" />
                <Text style={styles.globalRatingText}>
                  {game.rating ? parseFloat(game.rating).toFixed(1) : '—'}
                </Text>
                <Text style={styles.globalRatingCount}>({game.ratings_count || reviews.length})</Text>
              </View>
            </View>

            {/* FORMULAIRE AVIS */}
            {isLoggedIn ? (
              <View style={styles.writeReviewCard}>
                <Text style={styles.writeReviewLabel}>
                  {myReview ? 'Modifier ton avis' : 'Laisser un avis'}
                </Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity key={i} onPress={() => setUserRating(i)}>
                      <MaterialIcons name={i <= userRating ? 'star' : 'star-border'} size={30} color="#facc15" />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Partagez votre expérience..."
                  placeholderTextColor={COLORS.textMuted}
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.submitBtn, (isSubmitting || !reviewText.trim() || userRating === 0) && { opacity: 0.4 }]}
                  onPress={handleSubmitReview}
                  disabled={isSubmitting || !reviewText.trim() || userRating === 0}
                >
                  {isSubmitting
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text style={styles.submitBtnText}>Publier</Text>
                  }
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.loginToReview}
                onPress={() => navigation.navigate('Login')}
              >
                <MaterialIcons name="lock-outline" size={18} color={COLORS.textMuted} />
                <Text style={styles.loginToReviewText}>Connecte-toi pour laisser un avis</Text>
              </TouchableOpacity>
            )}

            {/* LISTE DES AVIS */}
            {reviews.length > 0 ? reviews.map((review, index) => (
              <View key={review._id || review.id || index} style={styles.reviewCard}>
                <TouchableOpacity
                  style={styles.reviewUserRow}
                  onPress={() => review.user?._id && navigation.navigate('Profile', { userId: review.user._id })}
                >
                  {review.user?.avatar || review.avatar ? (
                    <Image
                      source={{ uri: review.user?.avatar || review.avatar }}
                      style={styles.reviewAvatar}
                    />
                  ) : (
                    <View style={[styles.reviewAvatar, { backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialIcons name="person" size={18} color={COLORS.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>
                      {review.user?.displayName || review.user?.username || review.name || 'Joueur'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <MaterialIcons key={i} name={i <= review.rating ? 'star' : 'star-border'} size={13} color="#facc15" />
                      ))}
                      <Text style={styles.reviewDate}>
                        {'  '}
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString('fr-FR')
                          : review.date || ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <Text style={styles.reviewBody}>{review.text}</Text>
              </View>
            )) : (
              <View style={{ alignItems: 'center', padding: 30 }}>
                <MaterialIcons name="rate-review" size={36} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 13 }}>
                  Sois le premier à laisser un avis !
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── MODAL BIBLIOTHÈQUE ── */}
      <Modal visible={showLibraryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ajouter à ma bibliothèque</Text>
            <Text style={styles.modalSubtitle}>{game.name}</Text>
            {[
              { status: 'playing', label: '🎮 En cours', sub: 'Je joue actuellement' },
              { status: 'completed', label: '✅ Terminé', sub: 'J\'ai fini ce jeu' },
              { status: 'to_play',  label: '⭐ Wishlist', sub: 'Je veux y jouer' },
              { status: 'dropped', label: '❌ Abandonné', sub: 'J\'ai arrêté' },
            ].map(({ status, label, sub }) => (
              <TouchableOpacity
                key={status}
                style={styles.libOption}
                onPress={() => handleAddToLibrary(status)}
                disabled={isAddingToLib}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.libOptionLabel}>{label}</Text>
                  <Text style={styles.libOptionSub}>{sub}</Text>
                </View>
                {isAddingToLib && <ActivityIndicator size="small" color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowLibraryModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL LISTES ── */}
      <Modal visible={showListModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ajouter à une liste</Text>
            {myLists.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 30 }}>
                <MaterialIcons name="playlist-add" size={40} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textMuted, marginTop: 10, textAlign: 'center' }}>
                  Tu n'as pas encore de liste.{'\n'}Crée-en une depuis ton profil.
                </Text>
              </View>
            ) : (
              myLists.map(list => (
                <TouchableOpacity
                  key={list._id}
                  style={styles.libOption}
                  onPress={() => handleAddToList(list._id)}
                >
                  <MaterialIcons name="playlist-play" size={22} color={COLORS.primary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.libOptionLabel}>{list.name}</Text>
                    <Text style={styles.libOptionSub}>{list.items?.length || 0} jeu(x)</Text>
                  </View>
                  <MaterialIcons name="add" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity onPress={() => setShowListModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  retourBtn: { marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 10, backgroundColor: COLORS.bgDark, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  navBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  navTitle: { color: COLORS.textLight, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  heroContainer: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(13,13,20,0.55)', justifyContent: 'flex-end', padding: 16 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  topRatedBadge: { backgroundColor: 'rgba(124,58,237,0.25)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
  topRatedText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: '800', lineHeight: 34 },
  ratingBox: { backgroundColor: 'rgba(26,26,46,0.9)', padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, minWidth: 56 },
  ratingLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  ratingValue: { color: '#4ade80', fontSize: 22, fontWeight: '800' },
  section: { padding: 20 },
  genreText: { color: COLORS.primary, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  platformTag: { backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  platformTagText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  description: { color: '#cbd5e1', lineHeight: 22, fontSize: 14, marginBottom: 10 },
  translateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primaryBorder },
  translateBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8, borderWidth: 1, paddingHorizontal: 16 },
  actionBtnText: { fontWeight: '700', fontSize: 14 },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 20 },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: COLORS.textLight, fontSize: 18, fontWeight: '700' },
  globalRating: { flexDirection: 'row', alignItems: 'center' },
  globalRatingText: { color: '#facc15', fontWeight: '700', fontSize: 16, marginLeft: 4 },
  globalRatingCount: { color: COLORS.textMuted, fontSize: 12, marginLeft: 4 },
  loginToReview: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  loginToReviewText: { color: COLORS.textMuted, fontSize: 14 },
  writeReviewCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  writeReviewLabel: { color: COLORS.textLight, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  starRow: { flexDirection: 'row', marginBottom: 14, gap: 4 },
  reviewInput: { backgroundColor: COLORS.bgDark, color: COLORS.textLight, borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 20, minHeight: 90, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  reviewCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  reviewUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 12 },
  reviewerName: { color: COLORS.textLight, fontWeight: '700', fontSize: 14 },
  reviewDate: { color: COLORS.textMuted, fontSize: 11 },
  reviewBody: { color: '#cbd5e1', fontSize: 14, lineHeight: 21 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surfaceElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.textLight, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 20 },
  libOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  libOptionLabel: { color: COLORS.textLight, fontWeight: '700', fontSize: 15 },
  libOptionSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  cancelBtn: { marginTop: 8, backgroundColor: COLORS.surface, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
});
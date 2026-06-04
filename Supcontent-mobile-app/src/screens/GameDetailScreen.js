import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const RAWG_API_KEY = process.env.EXPO_PUBLIC_RAWG_API_KEY;

const COLORS = {
  primary: '#7c3aed',
  primaryLight: 'rgba(124,58,237,0.15)',
  bgDark: '#0d0d14',
  surface: '#13131f',
  surfaceElevated: '#1a1a2e',
  border: 'rgba(255,255,255,0.06)',
  textLight: '#f1f5f9',
  textMuted: '#64748b',
};

export default function GameDetailScreen({ route, navigation }) {
  const { id, gameId } = route.params || {};
  const finalId = id || gameId;
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [reviews, setReviews] = useState([
    {
      id: '1',
      name: 'Kai_Runner',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      rating: 5,
      text: 'Excellent jeu ! Les graphismes sont incroyables et l\'histoire est très prenante.',
      date: 'Il y a 2 jours',
    }
  ]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!finalId) { setIsLoading(false); return; }
      try {
        setIsLoading(true);
        const response = await fetch(`https://api.rawg.io/api/games/${finalId}?key=${RAWG_API_KEY}`);
        const data = await response.json();
        setGame(data);
      } catch (error) {
        console.log("Erreur API Détails :", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [finalId]);

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;
    if (userRating === 0) {
      Alert.alert('Note requise', 'Veuillez sélectionner une note avant de publier.');
      return;
    }
    const newReview = {
      id: Date.now().toString(),
      name: 'Moi',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      rating: userRating,
      text: reviewText.trim(),
      date: "À l'instant",
    };
    setReviews(prev => [newReview, ...prev]);
    setReviewText('');
    setUserRating(0);
  };

  const handleAddToGallery = () => {
    Alert.alert('Ajouté !', `${game?.name || game?.title} a été ajouté à votre galerie.`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!game || game.detail === "Not found.") {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textLight, fontSize: 16 }}>Impossible de charger ce jeu.</Text>
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
              source={{ uri: game.background_image || game.backgroundImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80' }}
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay}>
              <View style={styles.heroBottom}>
                <View style={{ flex: 1 }}>
                  {game.rating > 4.5 && (
                    <View style={styles.topRatedBadge}>
                      <Text style={styles.topRatedText}>Top Rated</Text>
                    </View>
                  )}
                  <Text style={styles.heroTitle} numberOfLines={2}>{game.name || game.title}</Text>
                </View>
                <View style={styles.ratingBox}>
                  <Text style={styles.ratingLabel}>NOTE</Text>
                  <Text style={styles.ratingValue}>{game.rating || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* INFO */}
          <View style={styles.section}>
            <Text style={styles.genreText}>
              {game.genres && game.genres.length > 0
                ? game.genres.map(g => typeof g === 'string' ? g : g.name).join(' · ')
                : 'Action · Adventure'}
              {game.released ? `  ·  ${game.released.substring(0, 4)}` : ''}
            </Text>
            <Text style={styles.description} numberOfLines={5}>
              {game.description_raw || game.description || "Aucune description disponible."}
            </Text>
            <TouchableOpacity style={styles.galleryBtn} onPress={handleAddToGallery}>
              <MaterialIcons name="add-photo-alternate" size={20} color="white" />
              <Text style={styles.galleryBtnText}>Ajouter à ma galerie</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* REVIEWS */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Avis & Notes</Text>
              <View style={styles.globalRating}>
                <MaterialIcons name="star" size={16} color="#facc15" />
                <Text style={styles.globalRatingText}>{game.rating || '—'}</Text>
                <Text style={styles.globalRatingCount}>({game.ratings_count || 0})</Text>
              </View>
            </View>

            {/* WRITE REVIEW */}
            <View style={styles.writeReviewCard}>
              <Text style={styles.writeReviewLabel}>Laisser un avis</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <TouchableOpacity key={i} onPress={() => setUserRating(i)}>
                    <MaterialIcons name={i <= userRating ? 'star' : 'star-border'} size={28} color="#facc15" />
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
                style={[styles.submitBtn, (!reviewText.trim() || userRating === 0) && { opacity: 0.4 }]}
                onPress={handleSubmitReview}
                disabled={!reviewText.trim() || userRating === 0}
              >
                <Text style={styles.submitBtnText}>Publier</Text>
              </TouchableOpacity>
            </View>

            {/* REVIEW LIST */}
            {reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewUserRow}>
                  <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>{review.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <MaterialIcons key={i} name={i <= review.rating ? 'star' : 'star-border'} size={13} color="#facc15" />
                      ))}
                      <Text style={styles.reviewDate}>  {review.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewBody}>{review.text}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  retourBtn: { marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 10, backgroundColor: COLORS.bgDark,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  navBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  navTitle: { color: COLORS.textLight, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  heroContainer: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(13,13,20,0.55)', justifyContent: 'flex-end', padding: 16 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  topRatedBadge: {
    backgroundColor: 'rgba(124,58,237,0.25)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
  },
  topRatedText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: '800', lineHeight: 34 },
  ratingBox: { backgroundColor: 'rgba(26,26,46,0.9)', padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, minWidth: 56 },
  ratingLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  ratingValue: { color: '#4ade80', fontSize: 22, fontWeight: '800' },
  section: { padding: 20 },
  genreText: { color: COLORS.primary, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  description: { color: '#cbd5e1', lineHeight: 22, fontSize: 14 },
  galleryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 14, marginTop: 20, gap: 8,
  },
  galleryBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 20 },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: COLORS.textLight, fontSize: 18, fontWeight: '700' },
  globalRating: { flexDirection: 'row', alignItems: 'center' },
  globalRatingText: { color: '#facc15', fontWeight: '700', fontSize: 16, marginLeft: 4 },
  globalRatingCount: { color: COLORS.textMuted, fontSize: 12, marginLeft: 4 },
  writeReviewCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  writeReviewLabel: { color: COLORS.textLight, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  starRow: { flexDirection: 'row', marginBottom: 14, gap: 4 },
  reviewInput: {
    backgroundColor: COLORS.bgDark, color: COLORS.textLight,
    borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 20,
    minHeight: 90, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  submitBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  reviewCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  reviewUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 12 },
  reviewerName: { color: COLORS.textLight, fontWeight: '700', fontSize: 14 },
  reviewDate: { color: COLORS.textMuted, fontSize: 11 },
  reviewBody: { color: '#cbd5e1', fontSize: 14, lineHeight: 21 },
});
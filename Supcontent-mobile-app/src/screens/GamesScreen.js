import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, FlatList, Image,
  TouchableOpacity, TextInput, ScrollView, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { contentAPI } from '../services/api';

const COLORS = {
  primary: '#7c3aed',
  primaryLight: 'rgba(124, 58, 237, 0.15)',
  bgDark: '#0d0d14',
  surface: '#13131f',
  surfaceElevated: '#1a1a2e',
  border: 'rgba(255,255,255,0.06)',
  textLight: '#f1f5f9',
  textMuted: '#64748b',
};

const CATEGORIES = ['Tous', 'Action', 'RPG', 'Strategy', 'Adventure', 'Indie', 'Sport'];

export default function GamesScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [games, setGames] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchDiscoveryGames = async () => {
      try {
        setIsLoading(true);
        const response = await contentAPI.getPopular(2);
        const data = response.data.results || response.data;
        setAllGames(Array.isArray(data) ? data : []);
        setGames(Array.isArray(data) ? data : []);
      } catch (error) {
        console.log("Erreur API Discovery :", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDiscoveryGames();
  }, []);

  useEffect(() => {
    let filtered = allGames;
    if (activeCategory !== 'Tous') {
      filtered = filtered.filter(g => {
        const genres = g.genres || [];
        return genres.some(genre => {
          const name = typeof genre === 'string' ? genre : genre.name || '';
          return name.toLowerCase().includes(activeCategory.toLowerCase());
        });
      });
    }
    if (searchText.trim()) {
      filtered = filtered.filter(g =>
        (g.title || g.name || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setGames(filtered);
  }, [activeCategory, searchText, allGames]);

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Discovery</Text>
      </View>
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un jeu..."
          placeholderTextColor={COLORS.textMuted}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setActiveCategory(cat)}
            style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
          >
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => navigation.navigate('GameDetail', { gameId: 58781 })}
      >
        <Image
          source={{ uri: 'https://media.rawg.io/media/games/b40/b40eba32d8715d5fdf9634939fe0eca3.jpg' }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>À LA UNE</Text></View>
          <Text style={styles.featuredTitle}>The Elder Scrolls VI</Text>
          <View style={styles.featuredMeta}>
            <Text style={styles.featuredGenre}>Action RPG</Text>
            <View style={styles.featuredRating}>
              <MaterialIcons name="star" size={13} color="#facc15" />
              <Text style={styles.featuredRatingText}>4.9</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <Text style={styles.sectionLabel}>
        {activeCategory === 'Tous' ? 'Trending Now' : activeCategory}
        {games.length > 0 && <Text style={{ color: COLORS.textMuted, fontSize: 14 }}> · {games.length}</Text>}
      </Text>
      {isLoading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20, marginBottom: 10 }} />}
      {!isLoading && games.length === 0 && (
        <View style={{ padding: 30, alignItems: 'center' }}>
          <Text style={{ color: COLORS.textMuted }}>Aucun jeu trouvé.</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={games}
        ListHeaderComponent={ListHeader}
        keyExtractor={(item, index) => item.externalId ? item.externalId.toString() : index.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gameCard}
            onPress={() => navigation.navigate('GameDetail', { gameId: item.externalId })}
            activeOpacity={0.85}
          >
            <View style={styles.cardImageContainer}>
              <Image source={{ uri: item.backgroundImage || 'https://via.placeholder.com/500' }} style={styles.cardImage} />
              <View style={styles.cardRatingBadge}>
                <MaterialIcons name="star" size={12} color="#facc15" />
                <Text style={styles.cardRatingText}>{item.rating || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title || item.name}</Text>
                <MaterialIcons name="favorite-border" size={20} color={COLORS.textMuted} />
              </View>
              <Text style={styles.cardGenre}>
                {item.genres && item.genres.length > 0
                  ? item.genres.map(g => typeof g === 'string' ? g : g.name).join(' · ')
                  : 'Action · Adventure'}
              </Text>
              <View style={styles.cardBtn}>
                <Text style={styles.cardBtnText}>Voir les détails</Text>
                <MaterialIcons name="arrow-forward" size={15} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  headerContainer: { padding: 16 },
  topBar: { paddingTop: 24, marginBottom: 16 },
  pageTitle: { color: COLORS.textLight, fontSize: 26, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14,
    paddingHorizontal: 16, height: 48,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  searchInput: { flex: 1, color: COLORS.textLight, marginLeft: 10, fontSize: 14 },
  categoryScroll: { marginBottom: 20 },
  categoryChip: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surface, marginRight: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: 'white' },
  featuredCard: { height: 200, borderRadius: 18, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  featuredImage: { width: '100%', height: '100%', position: 'absolute' },
  featuredOverlay: { flex: 1, backgroundColor: 'rgba(13,13,20,0.6)', justifyContent: 'flex-end', padding: 16 },
  featuredBadge: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  featuredBadgeText: { color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  featuredTitle: { color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 6 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center' },
  featuredGenre: { color: '#d1d5db', fontSize: 13, marginRight: 12 },
  featuredRating: { flexDirection: 'row', alignItems: 'center' },
  featuredRatingText: { color: '#facc15', fontWeight: '700', marginLeft: 4, fontSize: 13 },
  sectionLabel: { color: COLORS.textLight, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  gameCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    marginBottom: 14, marginHorizontal: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardImageContainer: { height: 180, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardRatingBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  cardRatingText: { color: 'white', fontSize: 11, fontWeight: '700', marginLeft: 4 },
  cardContent: { padding: 14 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { color: COLORS.textLight, fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  cardGenre: { color: COLORS.textMuted, fontSize: 12, marginBottom: 14 },
  cardBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.12)', paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  cardBtnText: { color: COLORS.primary, fontWeight: '700', marginRight: 6, fontSize: 13 },
});
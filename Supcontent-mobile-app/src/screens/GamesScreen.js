import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, Image, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#8a2ce2', bgDark: '#191121', surfaceDark: '#271b32', borderDark: '#362546', textMuted: '#94a3b8'
};

const CATEGORIES = ['All Games', 'Action', 'RPG', 'Strategy', 'Adventure', 'Indie'];

export default function GamesScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('All Games');

  // Fausses données en attendant l'API
  const games = [
    { id: '1', title: 'Eldoria Realms', genre: 'Adventure • Open World', rating: 4.8, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80' },
    { id: '2', title: 'Astra Conflict', genre: 'Strategy • Sci-Fi', rating: 4.7, image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=500&q=80' },
    { id: '3', title: 'Nitro Velocity', genre: 'Racing • Simulation', rating: 4.5, image: 'https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=500&q=80' },
  ];

  // LE HAUT DE LA PAGE (Recherche, Filtres, Featured Game)
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Header Top */}
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <View style={styles.iconBg}><MaterialIcons name="explore" size={24} color={COLORS.primary} /></View>
          <Text style={styles.pageTitle}>Discovery</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications" size={24} color="white" />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search games, genres, creators..." placeholderTextColor={COLORS.textMuted} />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat, index) => (
          <TouchableOpacity key={index} onPress={() => setActiveCategory(cat)}
            style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}>
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Game */}
      <TouchableOpacity 
        style={styles.featuredCard} 
        onPress={() => navigation.navigate('GameDetail', { gameId: 'featured' })}
      >
        <Image source={{ uri: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80' }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>FEATURED</Text></View>
          <Text style={styles.featuredTitle}>Neon Syndicate</Text>
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredGenre}>Action RPG</Text>
            <View style={styles.ratingBox}>
              <MaterialIcons name="star" size={14} color="#facc15" />
              <Text style={styles.ratingTextFeatured}>4.9</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Trending Now</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={games}
        ListHeaderComponent={ListHeader}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.gameCard}
            onPress={() => navigation.navigate('GameDetail', { game: item })}
          >
            <View style={styles.cardImageContainer}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardRatingOverlay}>
                <MaterialIcons name="star" size={12} color="#facc15" />
                <Text style={styles.cardRatingText}>{item.rating}</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <MaterialIcons name="favorite-border" size={20} color={COLORS.textMuted} />
              </View>
              <Text style={styles.cardGenre}>{item.genre}</Text>
              <View style={styles.cardBtn}>
                <Text style={styles.cardBtnText}>View Details</Text>
                <MaterialIcons name="arrow-forward" size={16} color={COLORS.primary} />
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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 30 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { backgroundColor: 'rgba(138, 44, 226, 0.2)', padding: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: 'rgba(138, 44, 226, 0.3)' },
  pageTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  notifBtn: { position: 'relative', padding: 8, backgroundColor: COLORS.surfaceDark, borderRadius: 20 },
  notifDot: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, backgroundColor: COLORS.primary, borderRadius: 4, borderWidth: 1, borderColor: COLORS.bgDark },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceDark, borderRadius: 12, paddingHorizontal: 16, height: 50 },
  searchInput: { flex: 1, color: 'white', marginLeft: 10 },
  categoryScroll: { marginTop: 16, marginBottom: 20 },
  categoryChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surfaceDark, marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
  categoryChipActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 5 },
  categoryText: { color: COLORS.textMuted, fontSize: 12, fontWeight: 'bold' },
  categoryTextActive: { color: 'white' },
  featuredCard: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  featuredImage: { width: '100%', height: '100%', position: 'absolute' },
  featuredOverlay: { flex: 1, backgroundColor: 'rgba(25, 17, 33, 0.6)', justifyContent: 'flex-end', padding: 16 },
  featuredBadge: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
  featuredBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  featuredTitle: { color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  featuredInfo: { flexDirection: 'row', alignItems: 'center' },
  featuredGenre: { color: '#d1d5db', fontSize: 14, marginRight: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center' },
  ratingTextFeatured: { color: '#facc15', fontWeight: 'bold', marginLeft: 4 },
  sectionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  gameCard: { backgroundColor: COLORS.surfaceDark, borderRadius: 16, marginBottom: 16, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderDark },
  cardImageContainer: { height: 200, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardRatingOverlay: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  cardRatingText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  cardContent: { padding: 16 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cardGenre: { color: COLORS.textMuted, fontSize: 12, marginTop: 4, marginBottom: 16 },
  cardBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(138, 44, 226, 0.1)', paddingVertical: 12, borderRadius: 24 },
  cardBtnText: { color: COLORS.primary, fontWeight: 'bold', marginRight: 8 }
});
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Image, FlatList,
  TouchableOpacity, Linking, ActivityIndicator, Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { contentAPI, dealsAPI, socialAPI, newsAPI } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#7c3aed',
  primaryLight: 'rgba(124, 58, 237, 0.15)',
  primaryBorder: 'rgba(124, 58, 237, 0.25)',
  bgDark: '#0d0d14',
  surface: '#13131f',
  surfaceElevated: '#1a1a2e',
  accentBlue: '#06b6d4',
  accentGreen: '#10b981',
  textLight: '#f1f5f9',
  textMuted: '#64748b',
  border: 'rgba(255,255,255,0.06)',
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const SPACING = 12;

const FALLBACK_EVENTS = [
  { id: '1', title: "Call of Duty League 2026 - Major Championship", category: "TOURNOI E-SPORT", status: "🔴 EN DIRECT", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80", url: "https://www.twitch.tv/callofduty" },
  { id: '2', title: "PlayStation Showcase : Les sorties de la rentrée", category: "CONFÉRENCE", status: "CE SOIR 20H", image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=800&q=80", url: "https://www.youtube.com/playstation" },
  { id: '3', title: "Elden Ring - World Record Speedrun Attempt", category: "SPEEDRUN", status: "🔴 EN DIRECT", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80", url: "https://www.twitch.tv" },
  { id: '4', title: "Global Game Jam 2026 - Finales", category: "INDIE DEV", status: "DEMAIN 14H", image: "https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=800&q=80", url: "https://globalgamejam.org" },
];

const ACTIVE_ROOMS = [
  { id: '101', game: "GTA VI", usersCount: 142, image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80" },
  { id: '102', game: "Valorant", usersCount: 89, image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80" },
  { id: '103', game: "Elden Ring", usersCount: 56, image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&q=80" },
  { id: '104', game: "Fortnite", usersCount: 204, image: "https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=200&q=80" },
  { id: '105', game: "Minecraft", usersCount: 73, image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80" },
];

export default function HomeScreen({ navigation }) {
  const [popularGames, setPopularGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState(FALLBACK_EVENTS);
  const [newReleases, setNewReleases] = useState([]);
  const flatListRef = useRef(null);
  const [activeRooms, setActiveRooms] = useState([]);
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    if (events.length === 0) return;
    let currentIndex = 0;
    const timer = setInterval(() => {
      currentIndex = (currentIndex + 1) % events.length;
      flatListRef.current?.scrollToOffset({ offset: currentIndex * (CARD_WIDTH + SPACING), animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [events]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        const results = await Promise.allSettled([
          contentAPI.getPopular(1),
          dealsAPI.getTopDeals(),
          contentAPI.getNewReleases(),
          socialAPI.getActiveRooms(),
          socialAPI.getEvents(),
          newsAPI.getHeadlines()
        ]);
        if (results[0].status === 'fulfilled') {
          const data = results[0].value.data;
          const list = data.results || data;
          setPopularGames(Array.isArray(list) ? list.slice(0, 5) : []);
        }
        if (results[2].status === 'fulfilled') {
          const data = results[2].value.data;
          const list = data.results || data;
          setNewReleases(Array.isArray(list) ? list.slice(0, 5) : []);
        }
        if (results[3].status === 'fulfilled') setActiveRooms(results[3].value.data);
        if (results[4].status === 'fulfilled') {
          const data = results[4].value.data;
          const list = data.results || data;
          if (Array.isArray(list) && list.length > 0) setEvents(list.slice(0, 5));
        }
        if (results[5].status === 'fulfilled') {
          setHeadlines((results[5].value.data || []).slice(0, 4));
        }
      } catch (error) {
        console.log("Erreur:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const displayRooms = activeRooms.length > 0 ? activeRooms : ACTIVE_ROOMS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIconBg}>
            <MaterialIcons name="videogame-asset" size={18} color="white" />
          </View>
          <Text style={styles.logoText}>SUPCONTENT</Text>
        </View>
      </View>

      <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>

        {/* LIVE & UPCOMING EVENTS */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Live & Upcoming</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>EN DIRECT</Text>
            </View>
          </View>
          <FlatList
            ref={flatListRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={events}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            snapToInterval={CARD_WIDTH + SPACING}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum={true}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ width: CARD_WIDTH, marginRight: SPACING }}
                activeOpacity={0.9}
                onPress={() => item.url && Linking.openURL(item.url)}
              >
                <View style={styles.eventCard}>
                  <Image
                    source={{ uri: item.image || item.backgroundImage || item.background_image }}
                    style={styles.eventImage}
                    resizeMode="cover"
                  />
                  <View style={styles.eventOverlay}>
                    <View style={[styles.statusBadge, {
                      backgroundColor: (item.status || '').includes('DIRECT') ? 'rgba(239,68,68,0.9)' : 'rgba(59,130,246,0.85)'
                    }]}>
                      <Text style={styles.statusBadgeText}>{item.status || 'EVENT'}</Text>
                    </View>
                    <Text style={styles.eventCategory}>{item.category || 'Général'}</Text>
                    <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
                    <TouchableOpacity
                      style={styles.joinBtn}
                      onPress={() => navigation.navigate('GameDetail', { id: item.externalId || item.id })}
                    >
                      <Text style={styles.joinBtnText}>Rejoindre</Text>
                      <MaterialIcons name="arrow-forward" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* SALONS ACTIFS */}
        <View style={{ marginTop: 32 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Salons Actifs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Rooms')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={displayRooms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.roomItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Rooms', { roomId: item.id, game: item.game })}
              >
                <View style={styles.roomAvatarWrap}>
                  <Image source={{ uri: item.image }} style={styles.roomAvatar} />
                  <View style={styles.roomOnlineDot} />
                </View>
                <Text style={styles.roomGameName} numberOfLines={1}>{item.game}</Text>
                <Text style={styles.roomCount}>{item.usersCount} en ligne</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* POPULAR NOW */}
        <View style={{ marginTop: 32 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Popular Now</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Games')}>
              <Text style={styles.seeAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {isLoading ? (
              <View style={{ width: 280, height: 180, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : popularGames.length > 0 ? (
              popularGames.map((game, index) => (
                <TouchableOpacity
                  key={game.externalId ? game.externalId.toString() : index.toString()}
                  style={styles.popularCard}
                  onPress={() => navigation.navigate('GameDetail', { gameId: game.externalId })}
                >
                  <Image source={{ uri: game.backgroundImage || game.background_image || 'https://via.placeholder.com/500x300' }} style={styles.popularImage} />
                  <View style={styles.popularOverlay}>
                    <View style={styles.popularRating}>
                      <MaterialIcons name="star" size={12} color="#facc15" />
                      <Text style={styles.popularRatingText}>{game.rating || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.popularInfo}>
                    <Text style={styles.popularTitle} numberOfLines={1}>{game.title || game.name}</Text>
                    <Text style={styles.popularSub}>{game.ratingsCount ? `${game.ratingsCount} avis` : 'Trending'}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={{ color: COLORS.textMuted }}>Serveur hors-ligne</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* INDUSTRY HEADLINES */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Industry News</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NewsListScreen')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {headlines && headlines.length > 0 ? headlines.map((news, index) => (
            <TouchableOpacity
              key={news.id || index.toString()}
              style={styles.newsCard}
              activeOpacity={0.8}
              onPress={() => news.url && Linking.openURL(news.url)}
            >
              <Image source={{ uri: news.image || news.urlToImage || 'https://via.placeholder.com/80' }} style={styles.newsImage} />
              <View style={styles.newsContent}>
                <Text style={styles.newsSource}>{news.source?.name || news.source || 'News'}</Text>
                <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
                <Text style={styles.newsDate}>
                  {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('fr-FR') : (news.time || "Aujourd'hui")}
                </Text>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyState}>
              <Text style={{ color: COLORS.textMuted }}>Chargement des actualités...</Text>
            </View>
          )}
        </View>

        {/* NEW RELEASES */}
        <View style={{ marginTop: 32 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>New Releases ✨</Text>
            <TouchableOpacity onPress={() => navigation.navigate('GameListScreen', { type: 'newreleases', title: 'Nouveautés' })}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={newReleases}
            keyExtractor={(item) => item.externalId ? item.externalId.toString() : Math.random().toString()}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.releaseCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('GameDetail', { id: item.externalId || item.id })}
              >
                <Image
                  source={{ uri: item.backgroundImage || item.background_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80' }}
                  style={styles.releaseImage}
                />
                <Text style={styles.releaseTitle} numberOfLines={1}>{item.title || item.name}</Text>
                <Text style={styles.releaseDate}>
                  {item.released ? new Date(item.released).toLocaleDateString('fr-FR') : 'Date inconnue'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* EXPLORE */}
        <View style={{ marginTop: 32, paddingHorizontal: 20, marginBottom: 40 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Explorer</Text>
          <View style={styles.platformGrid}>
            {[
              { id: 4, name: 'PC', icon: '🖥️' },
              { id: 187, name: 'PlayStation', icon: '🎮' },
              { id: 186, name: 'Xbox', icon: '🟢' },
              { id: 7, name: 'Switch', icon: '🕹️' }
            ].map(plat => (
              <TouchableOpacity
                key={plat.id}
                style={styles.platformCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('GameListScreen', { type: 'platform', platformId: plat.id, title: plat.name })}
              >
                <Text style={{ fontSize: 26, marginBottom: 6 }}>{plat.icon}</Text>
                <Text style={styles.platformName}>{plat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIconBg: { backgroundColor: COLORS.primary, padding: 7, borderRadius: 10, marginRight: 10 },
  logoText: { color: COLORS.textLight, fontSize: 17, fontWeight: '800', letterSpacing: 1.5 },
  mainScroll: { flex: 1 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 14,
  },
  sectionTitle: { color: COLORS.textLight, fontSize: 17, fontWeight: '700' },
  seeAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  livePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', marginRight: 5 },
  livePillText: { color: '#ef4444', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  eventCard: {
    height: 210, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  eventImage: { width: '100%', height: '100%', position: 'absolute' },
  eventOverlay: {
    flex: 1, backgroundColor: 'rgba(13,13,20,0.65)',
    justifyContent: 'flex-end', padding: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginBottom: 8,
  },
  statusBadgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
  eventCategory: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 },
  eventTitle: { color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 12, lineHeight: 26 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 12, gap: 6,
  },
  joinBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  emptyState: {
    marginHorizontal: 20, padding: 20, alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  roomItem: { alignItems: 'center', marginRight: 18, width: 72 },
  roomAvatarWrap: { position: 'relative', marginBottom: 8 },
  roomAvatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: COLORS.primaryBorder },
  roomOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: COLORS.accentGreen, borderWidth: 2, borderColor: COLORS.bgDark,
  },
  roomGameName: { color: COLORS.textLight, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  roomCount: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  popularCard: {
    width: 200, marginRight: 14, backgroundColor: COLORS.surface,
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
  },
  popularImage: { width: '100%', height: 120 },
  popularOverlay: { position: 'absolute', top: 8, right: 8 },
  popularRating: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  popularRatingText: { color: 'white', fontSize: 11, fontWeight: '700', marginLeft: 3 },
  popularInfo: { padding: 12 },
  popularTitle: { color: COLORS.textLight, fontWeight: '700', fontSize: 14 },
  popularSub: { color: COLORS.accentGreen, fontSize: 11, marginTop: 3 },
  newsCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 12, marginBottom: 10,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  newsImage: { width: 72, height: 72, borderRadius: 10 },
  newsContent: { marginLeft: 14, flex: 1 },
  newsSource: { color: COLORS.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  newsTitle: { color: COLORS.textLight, fontWeight: '600', fontSize: 13, marginTop: 4, lineHeight: 19 },
  newsDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 5 },
  releaseCard: { marginRight: 14, width: 130 },
  releaseImage: { width: 130, height: 170, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  releaseTitle: { color: COLORS.textLight, fontWeight: '700', fontSize: 12 },
  releaseDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  platformCard: {
    backgroundColor: COLORS.surface, width: '48%',
    padding: 18, borderRadius: 14, alignItems: 'center',
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  platformName: { color: COLORS.textLight, fontWeight: '700', fontSize: 13 },
});
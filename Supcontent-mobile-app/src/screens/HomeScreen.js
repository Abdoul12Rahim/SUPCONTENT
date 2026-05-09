import React, { useState, useEffect,useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image,FlatList, TouchableOpacity, TextInput,Linking, ActivityIndicator ,Dimensions} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { contentAPI,dealsAPI } from '../services/api';
// Couleurs de la charte graphique
const COLORS = {
  primary: '#8a2ce2',
  bgDark: '#191121',
  accentBlue: '#00d4ff',
  textLight: '#f8fafc',
  textMuted: '#94a3b8',
  panelBg: 'rgba(138, 44, 226, 0.05)',
  panelBorder: 'rgba(138, 44, 226, 0.2)',
};
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85; 
const SPACING = 15;
// Liste de nos Salons Actifs (Mock data en attendant le backend)
const ACTIVE_ROOMS = [
  { id: '101', game: "GTA VI", usersCount: 142, image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80" },
  { id: '102', game: "Valorant", usersCount: 89, image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80" },
  { id: '103', game: "Elden Ring", usersCount: 56, image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&q=80" },
  { id: '104', game: "Fortnite", usersCount: 204, image: "https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=200&q=80" },
  { id: '105', game: "Minecraft", usersCount: 73, image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=200&q=80" },
];
// Liste de nos événements (Hassane pourra les mettre dans la BDD plus tard)
const RAW_EVENTS = [
  { id: '1', title: "Call of Duty League 2026 - Major Championship", category: "TOURNOI E-SPORT", status: "🔴 EN DIRECT", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80", url: "https://www.twitch.tv/callofduty" },
  { id: '2', title: "PlayStation Showcase : Les sorties de la rentrée", category: "CONFÉRENCE", status: "CE SOIR 20H", image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=800&q=80", url: "https://www.youtube.com/playstation" },
  { id: '3', title: "Elden Ring - World Record Speedrun Attempt", category: "SPEEDRUN", status: "🔴 EN DIRECT", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80", url: "https://www.twitch.tv" },
  { id: '4', title: "Global Game Jam 2026 - Finales des développeurs", category: "INDIE DEV", status: "DEMAIN 14H", image: "https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=800&q=80", url: "https://globalgamejam.org" }
];

// Petite fonction pour mélanger le tableau aléatoirement
const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);
// Les news du jour (Mock data)
const HEADLINES = [
  { id: '1', source: 'IGN', title: 'Le prochain grand RPG s\'annonce massif : Premier aperçu', time: 'Il y a 2h', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80' },
  { id: '2', source: 'JeuxVideo.com', title: 'E-sport : Les résultats choquants du tournoi de ce week-end', time: 'Il y a 5h', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=400&q=80' },
];

// Les catégories d'exploration
const PLATFORMS = [
  { id: 'pc', name: 'PC', icon: '💻' },
  { id: 'ps', name: 'PlayStation', icon: '🎮' },
  { id: 'xbox', name: 'Xbox', icon: '🟢' },
  { id: 'nintendo', name: 'Switch', icon: '🔴' }
];
export default function HomeScreen({ navigation }) {
  
 const [popularGames, setPopularGames] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
const [featuredDeal, setFeaturedDeal] = useState(null);
const [events, setEvents] = useState([]);

  const flatListRef = useRef(null);

  // 2. Le minuteur du défilement automatique
  useEffect(() => {
   
    if (events.length === 0) return;

    let currentIndex = 0;
    
    const timer = setInterval(() => {
      currentIndex++;
      
    
      if (currentIndex >= events.length) {
        currentIndex = 0;
      }

      
      flatListRef.current?.scrollToOffset({
        offset: currentIndex * (CARD_WIDTH + SPACING),
        animated: true, 
      });
    }, 3500); 

   
    return () => clearInterval(timer);
  }, [events]);


// 1. Récupération des données de l'API au chargement du composant
 useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        setEvents(shuffleArray(RAW_EVENTS));
        const [gamesResponse, dealsResponse] = await Promise.all([
          contentAPI.getPopular(1),
          dealsAPI.getTopDeals()
        ]);
        
        const gamesList = gamesResponse.data.results || gamesResponse.data;
        setPopularGames(gamesList.slice(0, 5));
        
        if (dealsResponse.data && dealsResponse.data.length > 0) {
          setFeaturedDeal(dealsResponse.data[0]); 
        }

      } catch (error) {
        console.log("Erreur API :", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);
  // On prend le premier événement de la liste pour la section "Événement Spécial"
  const specialEvent = {
    title: "Call of Duty League 2026 - Major Championship",
    category: "TOURNOI E-SPORT",
    status: "🔴 EN DIRECT",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80", 
    url: "https://www.twitch.tv/callofduty"
  };

  
  const openEventLink = async () => {
    try {
      await Linking.openURL(specialEvent.url);
    } catch (error) {
      console.log("Impossible d'ouvrir le lien :", error);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER FIXE */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIconBg}>
            <MaterialIcons name="videogame-asset" size={20} color="white" />
          </View>
          <Text style={styles.logoText}>SUPCONTENT</Text>
        </View>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="notifications" size={24} color={COLORS.textLight} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' }} 
            style={styles.profilePic} 
          />
        </View>
      </View>

      <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
        {/* BARRE DE RECHERCHE MOBILE */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Explore the metaverse..." 
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

 {/* SECTION ÉVÉNEMENTS (Scroll Horizontal Aléatoire) */}
<View style={{ marginTop: 20, marginBottom: 10 }}>
  <Text style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 15 }]}>Live & Upcoming Events</Text>
  
<FlatList
    ref={flatListRef} 
    horizontal
    showsHorizontalScrollIndicator={false}
    data={events}
    keyExtractor={(item) => item.id}
    
    
    snapToInterval={CARD_WIDTH + SPACING} 
    snapToAlignment="start"
    decelerationRate="fast"
    disableIntervalMomentum={true}
    
  
    contentContainerStyle={{ paddingHorizontal: 20 }} 
    
    renderItem={({ item }) => (
      
      
      <View style={{ width: CARD_WIDTH, marginRight: SPACING }}>
        
        <TouchableOpacity 
          
          style={[styles.heroSection, { width: '100%', margin: 0, marginHorizontal: 0, marginTop: 0 }]} 
          activeOpacity={0.9} 
          onPress={() => Linking.openURL(item.url)} 
        >
          <Image 
            source={{ uri: item.image }} 
            style={styles.heroImage} 
          />
          <View style={styles.heroOverlay}>
            
            <View style={[styles.badge, { backgroundColor: item.status.includes('DIRECT') ? 'rgba(220, 38, 38, 0.9)' : 'rgba(59, 130, 246, 0.9)', borderColor: 'transparent' }]}>
              <Text style={[styles.badgeText, { color: 'white', fontWeight: 'bold' }]}>
                {item.status}
              </Text>
            </View>
            
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 }}>
              {item.category}
            </Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {item.title}
            </Text>
            
            <View style={styles.heroButtons}>
              <TouchableOpacity 
                style={[styles.btnPrimary, { backgroundColor: '#9146FF', width: '100%', justifyContent: 'center' }]}
                onPress={() => Linking.openURL(item.url)}
              >
                <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>Rejoindre</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </TouchableOpacity>
        
      </View>
    )}
  />
</View>
          {/* SECTION SALONS ACTIFS (Preuve Sociale) */}
<View style={{ marginTop: 10, marginBottom: 20 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 }}>
    <Text style={styles.sectionTitle}>Salons Actifs </Text>
    <TouchableOpacity>
      <Text style={{ color: '#9146FF', fontWeight: 'bold' }}>Voir tout</Text>
    </TouchableOpacity>
  </View>

  <FlatList
    horizontal
    showsHorizontalScrollIndicator={false}
    data={ACTIVE_ROOMS}
    keyExtractor={(item) => item.id}
    contentContainerStyle={{ paddingHorizontal: 20 }}
    renderItem={({ item }) => (
      <TouchableOpacity 
        style={{ alignItems: 'center', marginRight: 20 }}
        activeOpacity={0.7}
        
        onPress={() => alert(`Rejoindre le salon ${item.game} (${item.usersCount} en ligne)`)} 
      >
        {/* Bulle Avatar */}
        <View style={{ position: 'relative' }}>
          <Image 
            source={{ uri: item.image }} 
            style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#2d203b' }} 
          />
          
          <View style={{ 
            position: 'absolute', 
            bottom: 2, 
            right: 2, 
            backgroundColor: '#ef4444', 
            width: 16, 
            height: 16, 
            borderRadius: 8, 
            borderWidth: 2, 
            borderColor: '#191121' 
          }} />
        </View>

        {/* Nom du jeu et Compteur */}
        <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 8, fontSize: 12 }}>
          {item.game}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 10 }}>
          {item.usersCount} en ligne
        </Text>
      </TouchableOpacity>
    )}
  />
</View>
      {/* POPULAR NOW - CONNECTÉ À L'API ! */}
    <View style={styles.section}>
          <View style={styles.sectionHeaderBetween}>
            <Text style={styles.sectionTitle}>Popular Now</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Games')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
           {isLoading ? (
   <View style={{ width: 300, height: 180, justifyContent: 'center', alignItems: 'center' }}>
     <ActivityIndicator size="large" color={COLORS.primary} />
   </View>
) : popularGames.length > 0 ? (
  popularGames.map((game, index) => (
  <TouchableOpacity 
  
    key={game.externalId ? game.externalId.toString() : index.toString()} 
    style={styles.popularCard}
   
    onPress={() => navigation.navigate('GameDetail', { gameId: game.externalId })}
  >
    <Image 
      
      source={{ uri: game.backgroundImage || 'https://via.placeholder.com/500x300' }} 
      style={styles.popularImage} 
    />
    <View style={styles.popularInfo}>
      <View style={{ flex: 1 }}>
        {/* On utilise title au lieu de name */}
        <Text style={styles.popularTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.popularOnline}>
          {game.ratingsCount ? `${game.ratingsCount} avis` : 'Trending'}
        </Text>
      </View>
      <View style={styles.ratingContainer}>
        <MaterialIcons name="star" size={16} color={COLORS.accentBlue} />
        <Text style={styles.ratingText}>{game.rating || 'N/A'}</Text>
      </View>
    </View>
  </TouchableOpacity>
))
) : (
   <View style={{ width: 300, height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceDark, borderRadius: 16 }}>
     <Text style={{ color: COLORS.textMuted }}>Serveur hors-ligne</Text>
   </View>
)}
          </ScrollView>
        </View>
        {/* SECTION : INDUSTRY HEADLINES (News quotidiennes) */}
<View style={{ marginTop: 20, paddingHorizontal: 20 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
    <Text style={styles.sectionTitle}>Industry Headlines 📰</Text>
    <TouchableOpacity>
      <Text style={{ color: '#94a3b8', fontSize: 12 }}>Voir tout</Text>
    </TouchableOpacity>
  </View>

  {HEADLINES.map(news => (
    <TouchableOpacity 
      key={news.id} 
      style={{ flexDirection: 'row', backgroundColor: '#1e1525', borderRadius: 12, padding: 10, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2d203b' }}
      activeOpacity={0.8}
    >
      <Image source={{ uri: news.image }} style={{ width: 80, height: 80, borderRadius: 8 }} />
      <View style={{ marginLeft: 15, flex: 1 }}>
        <Text style={{ color: '#9146FF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{news.source}</Text>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14, marginTop: 4, lineHeight: 20 }} numberOfLines={2}>{news.title}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 6 }}>{news.time}</Text>
      </View>
    </TouchableOpacity>
  ))}
</View>

{/*  SECTION : NEW RELEASES (Placeholder) */}
{/*  on le branchera sur l'API RAWG plus tard */}
<View style={{ marginTop: 20, paddingHorizontal: 20 }}>
  <Text style={styles.sectionTitle}>New Releases ✨</Text>
  <View style={{ backgroundColor: '#1e1525', borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2d203b', borderStyle: 'dashed', marginTop: 10 }}>
    <Text style={{ color: '#94a3b8', textAlign: 'center' }}>Branchement API RAWG à venir...</Text>
  </View>
</View>

{/*  SECTION : EXPLORATION & HALL OF FAME */}
<View style={{ marginTop: 30, paddingHorizontal: 20, marginBottom: 40 }}>
  <Text style={styles.sectionTitle}>Explore 🌍</Text>
  
  {/* Grille des Plateformes */}
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 15 }}>
    {PLATFORMS.map(plat => (
      <TouchableOpacity 
        key={plat.id} 
        style={{ backgroundColor: '#1e1525', width: '47%', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#2d203b' }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 24, marginBottom: 8 }}>{plat.icon}</Text>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{plat.name}</Text>
      </TouchableOpacity>
    ))}
  </View>

  {/* Le  bouton Hall of Fame */}
  <TouchableOpacity 
    style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderWidth: 1, borderColor: '#eab308', borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 5 }}
    activeOpacity={0.8}
  >
    <Text style={{ fontSize: 28, marginRight: 15 }}>🏆</Text>
    <View>
      <Text style={{ color: '#eab308', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>2026 Hall of Fame</Text>
      <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Les jeux les mieux notés de l'année</Text>
    </View>
  </TouchableOpacity>
</View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40, 
    paddingBottom: 12,
    backgroundColor: COLORS.panelBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.panelBorder,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconBg: {
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  logoText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 12,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    backgroundColor: '#ef4444',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.bgDark,
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(138, 44, 226, 0.3)',
  },
  mainScroll: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 44, 226, 0.1)',
    margin: 16,
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textLight,
    paddingVertical: 12,
  },
  heroSection: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 17, 33, 0.6)', 
    justifyContent: 'flex-end',
    padding: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    marginBottom: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.accentBlue,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    color: COLORS.accentBlue,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  heroButtons: {
    flexDirection: 'row',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  btnSecondary: {
    backgroundColor: COLORS.panelBg,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  btnSecondaryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  horizontalList: {
    paddingLeft: 16,
  },
  gameCardSmall: {
    width: 140,
    marginRight: 16,
  },
  gameCardImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#1e293b',
    width: '100%',
    marginBottom: 6,
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  gameTitleSmall: {
    color: 'white',
    fontWeight: 'bold',
  },
  gameSubtitleSmall: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  popularCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: COLORS.panelBg,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    borderRadius: 12,
    padding: 12,
  },
  popularImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
  },
  popularInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  popularTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  popularOnline: {
    color: '#22c55e',
    fontSize: 12,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: COLORS.accentBlue,
    fontWeight: 'bold',
    marginLeft: 4,
  }
  
});
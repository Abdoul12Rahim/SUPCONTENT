import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { contentAPI } from '../services/api';

const COLORS = {
  primary: '#8a2ce2', bgDark: '#191121', surfaceDark: '#241a30', surfaceHighlight: '#2d203b', textMuted: '#94a3b8'
};

export default function GameDetailScreen({ route, navigation }) {
  const { gameId } = route.params; 
  
  // --- NOUVELLE LOGIQUE API ---
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        
        const response = await contentAPI.getGameDetails(gameId);
        setGame(response.data);
      } catch (error) {
        console.log("Erreur API Détails :", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (gameId) {
      fetchDetails();
    }
  }, [gameId]);


  if (isLoading || !game) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 10 }}>Chargement des données RAWG...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Game Details</Text>
        <TouchableOpacity style={styles.navBtn}>
          <MaterialIcons name="ios-share" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          {/* On utilise la vraie image dynamique */}
          <Image source={{ uri: game.backgroundImage || 'https://via.placeholder.com/800x400' }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <View style={styles.heroContentRow}>
              <View style={{flex: 1}}>
                {game.rating > 4.5 && (
                   <View style={styles.editorsChoice}><Text style={styles.editorsChoiceText}>Top Rated</Text></View>
                )}
                {/* On utilise le vrai titre dynamique */}
                <Text style={styles.heroTitle}>{game.title}</Text>
              </View>
              <View style={styles.metascoreBox}>
                <Text style={styles.metascoreLabel}>RATING</Text>
                {/* On affiche la vraie note sur 5 */}
                <Text style={styles.metascoreValue}>{game.rating || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tags & Description */}
        <View style={styles.detailsSection}>
          {/* On affiche les vrais genres */}
          <Text style={styles.tagsText}>
            {game.genres && game.genres.length > 0 ? game.genres.join('  •  ') : 'Action  •  Adventure'} 
            {game.released ? `  •  ${game.released.substring(0, 4)}` : ''}
          </Text>
          
          {/* On affiche la vraie description (RAWG la donne parfois avec des balises HTML, on verra si c'est le cas) */}
          <Text style={styles.description}>
            {game.description || "Aucune description disponible pour ce jeu pour le moment."}
          </Text>
          
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.buyBtn}>
              <MaterialIcons name="shopping-cart" size={20} color="white" />
              <Text style={styles.buyBtnText}>Play Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.favBtn}>
              <MaterialIcons name="favorite-border" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- LE RESTE DE TA PAGE RESTE IDENTIQUE (Achievements, Reviews) --- */}
        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.viewAllBtn}>View All</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingLeft: 16}}>
            {/* Achievement 1 */}
            <View style={styles.achieveCard}>
              <View style={[styles.achieveIconBg, { backgroundColor: '#eab308' }]}>
                <MaterialIcons name="emoji-events" size={24} color="white" />
              </View>
              <Text style={styles.achieveTitle}>City Legend</Text>
              <Text style={styles.achieveSub}>Rare • 50 XP</Text>
            </View>
            {/* Achievement 2 */}
            <View style={styles.achieveCard}>
              <View style={[styles.achieveIconBg, { backgroundColor: '#3b82f6' }]}>
                <MaterialIcons name="bolt" size={24} color="white" />
              </View>
              <Text style={styles.achieveTitle}>Netrunner</Text>
              <Text style={styles.achieveSub}>Common • 10 XP</Text>
            </View>
          </ScrollView>
        </View>

        <View style={styles.thickDivider} />

        {/* Reviews Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
          <View style={styles.ratingCard}>
             <View style={styles.scoreCol}>
               <Text style={styles.bigScore}>{game.rating || '0.0'}</Text>
               <View style={{flexDirection: 'row', marginVertical: 4}}>
                 {[1,2,3,4].map(i => <MaterialIcons key={i} name="star" size={16} color="#facc15" />)}
                 <MaterialIcons name="star-half" size={16} color="#facc15" />
               </View>
               <Text style={styles.reviewCount}>{game.ratingsCount || '0'} Reviews</Text>
             </View>
             <View style={styles.barsCol}>
                <TouchableOpacity style={styles.writeReviewBtn}>
                  <Text style={styles.writeReviewText}>Write a Review</Text>
                </TouchableOpacity>
             </View>
          </View>

          {/* User Review (Factice pour l'instant) */}
          <View style={styles.userReviewCard}>
            <View style={styles.reviewUserRow}>
               <Image source={{uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}} style={styles.avatar} />
               <View>
                 <Text style={styles.reviewerName}>Kai_Runner</Text>
                 <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {[1,2,3,4,5].map(i => <MaterialIcons key={i} name="star" size={12} color="#facc15" />)}
                    <Text style={styles.reviewDate}>  2 days ago</Text>
                 </View>
               </View>
            </View>
            <Text style={styles.reviewBody}>
              Excellent jeu ! Les graphismes sont incroyables et l'histoire est très prenante.
            </Text>
          </View>
        </View>
        
        <View style={{height: 40}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 40, backgroundColor: COLORS.bgDark },
  navBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  navTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  heroContainer: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(25, 17, 33, 0.5)', justifyContent: 'flex-end', padding: 16 },
  heroContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  editorsChoice: { backgroundColor: 'rgba(138, 44, 226, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(138, 44, 226, 0.3)' },
  editorsChoiceText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
  heroTitle: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  metascoreBox: { backgroundColor: 'rgba(45, 32, 59, 0.8)', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  metascoreLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold' },
  metascoreValue: { color: '#4ade80', fontSize: 24, fontWeight: 'bold' },
  detailsSection: { padding: 16 },
  tagsText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  description: { color: '#d1d5db', lineHeight: 22, fontSize: 14 },
  actionButtonsRow: { flexDirection: 'row', marginTop: 24, gap: 12 },
  buyBtn: { flex: 1, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  buyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  favBtn: { width: 52, height: 52, backgroundColor: COLORS.surfaceHighlight, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16 },
  thickDivider: { height: 8, backgroundColor: COLORS.surfaceDark, width: '100%' },
  section: { paddingVertical: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  viewAllBtn: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  achieveCard: { width: 130, backgroundColor: COLORS.surfaceDark, padding: 12, borderRadius: 12, marginRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  achieveIconBg: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  achieveTitle: { color: 'white', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  achieveSub: { color: COLORS.textMuted, fontSize: 10 },
  ratingCard: { backgroundColor: COLORS.surfaceDark, marginHorizontal: 16, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  scoreCol: { alignItems: 'center', width: '40%', borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  bigScore: { color: 'white', fontSize: 40, fontWeight: 'bold' },
  reviewCount: { color: COLORS.textMuted, fontSize: 12 },
  barsCol: { flex: 1, paddingLeft: 16, justifyContent: 'center' },
  writeReviewBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(138, 44, 226, 0.3)' },
  writeReviewText: { color: COLORS.primary, fontWeight: 'bold' },
  userReviewCard: { backgroundColor: COLORS.surfaceDark, marginHorizontal: 16, borderRadius: 16, padding: 16 },
  reviewUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewerName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  reviewDate: { color: COLORS.textMuted, fontSize: 12 },
  reviewBody: { color: '#d1d5db', fontSize: 14, lineHeight: 22 }
});
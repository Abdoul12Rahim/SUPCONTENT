import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#8a2ce2', bgDark: '#191121', surfaceDark: '#241a30', surfaceHighlight: '#2d203b', textMuted: '#94a3b8'
};

export default function GameDetailScreen({ route, navigation }) {
  // On récupère le jeu cliqué depuis la page précédente
  const gameTitle = route.params?.game?.title || "Cyberpunk 2077";
  const gameImage = route.params?.game?.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';

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
          <Image source={{ uri: gameImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <View style={styles.heroContentRow}>
              <View style={{flex: 1}}>
                <View style={styles.editorsChoice}><Text style={styles.editorsChoiceText}>Editor's Choice</Text></View>
                <Text style={styles.heroTitle}>{gameTitle}</Text>
              </View>
              <View style={styles.metascoreBox}>
                <Text style={styles.metascoreLabel}>METASCORE</Text>
                <Text style={styles.metascoreValue}>86</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tags & Description */}
        <View style={styles.detailsSection}>
          <Text style={styles.tagsText}>RPG  •  Open World  •  Sci-Fi  •  2020</Text>
          <Text style={styles.description}>
            Cyberpunk 2077 is an open-world, action-adventure RPG set in the megalopolis of Night City, where you play as a cyberpunk mercenary wrapped up in a do-or-die fight for survival.
          </Text>
          
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.buyBtn}>
              <MaterialIcons name="shopping-cart" size={20} color="white" />
              <Text style={styles.buyBtnText}>Buy Now $59.99</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.favBtn}>
              <MaterialIcons name="favorite-border" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

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
               <Text style={styles.bigScore}>4.3</Text>
               <View style={{flexDirection: 'row', marginVertical: 4}}>
                 {[1,2,3,4].map(i => <MaterialIcons key={i} name="star" size={16} color="#facc15" />)}
                 <MaterialIcons name="star-half" size={16} color="#facc15" />
               </View>
               <Text style={styles.reviewCount}>12.4k Reviews</Text>
             </View>
             <View style={styles.barsCol}>
                <TouchableOpacity style={styles.writeReviewBtn}>
                  <Text style={styles.writeReviewText}>Write a Review</Text>
                </TouchableOpacity>
             </View>
          </View>

          {/* User Review */}
          <View style={styles.userReviewCard}>
            <View style={styles.reviewUserRow}>
               <Image source={{uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}} style={styles.avatar} />
               <View>
                 <Text style={styles.reviewerName}>Kai_Runner</Text>
                 <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <MaterialIcons name="star" size={12} color="#facc15" />
                    <MaterialIcons name="star" size={12} color="#facc15" />
                    <MaterialIcons name="star" size={12} color="#facc15" />
                    <MaterialIcons name="star" size={12} color="#facc15" />
                    <MaterialIcons name="star" size={12} color="#facc15" />
                    <Text style={styles.reviewDate}>  2 days ago</Text>
                 </View>
               </View>
            </View>
            <Text style={styles.reviewBody}>
              Finally finished the main storyline. The graphics on the new update are insane! Night City feels more alive than ever.
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
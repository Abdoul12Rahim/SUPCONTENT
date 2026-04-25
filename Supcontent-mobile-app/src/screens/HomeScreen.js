import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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

export default function HomeScreen() {
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

        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80' }} 
            style={styles.heroImage} 
          />
          <View style={styles.heroOverlay}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Special Event Live</Text>
            </View>
            <Text style={styles.heroTitle}>Neon Nights: The Cyber Siege</Text>
            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>Explore</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CONTINUER À JOUER */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Recent Reaction</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            <View style={styles.gameCardSmall}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=300&q=80' }} style={styles.gameCardImage} />
              <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: '65%'}]} /></View>
              <Text style={styles.gameTitleSmall}>Elden Echoes</Text>
              <Text style={styles.gameSubtitleSmall}>65% Completed</Text>
            </View>
            <View style={styles.gameCardSmall}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=300&q=80' }} style={styles.gameCardImage} />
              <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: '12%'}]} /></View>
              <Text style={styles.gameTitleSmall}>Velocity 2077</Text>
              <Text style={styles.gameSubtitleSmall}>12% Completed</Text>
            </View>
          </ScrollView>
        </View>

        {/* POPULAR NOW */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderBetween}>
            <Text style={styles.sectionTitle}>Popular Now</Text>
            <Text style={styles.viewAllText}>View all</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            <View style={styles.popularCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=500&q=80' }} style={styles.popularImage} />
              <View style={styles.popularInfo}>
                <View>
                  <Text style={styles.popularTitle}>Vanguard Siege</Text>
                  <Text style={styles.popularOnline}>12k Online</Text>
                </View>
                <View style={styles.ratingContainer}>
                  <MaterialIcons name="star" size={16} color={COLORS.accentBlue} />
                  <Text style={styles.ratingText}>4.9</Text>
                </View>
              </View>
            </View>
             <View style={styles.popularCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=500&q=80' }} style={styles.popularImage} />
              <View style={styles.popularInfo}>
                <View>
                  <Text style={styles.popularTitle}>Overcharge</Text>
                  <Text style={styles.popularOnline}>8.4k Online</Text>
                </View>
                <View style={styles.ratingContainer}>
                  <MaterialIcons name="star" size={16} color={COLORS.accentBlue} />
                  <Text style={styles.ratingText}>4.7</Text>
                </View>
              </View>
            </View>
          </ScrollView>
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
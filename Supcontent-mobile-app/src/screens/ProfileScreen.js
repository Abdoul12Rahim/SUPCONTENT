import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext'; 
import GuestPrompt from '../components/GuestPrompt';

const COLORS = {
  primary: '#8a2ce2',
  bgDark: '#191121',
  surfaceDark: '#241a30',
  textMuted: '#94a3b8',
  borderDark: 'rgba(255,255,255,0.05)',
};

export default function ProfileScreen({ navigation, route }) {

  const { isLoggedIn } = useContext(AuthContext);
  // 1. Logique de profil (Simulée pour le moment)
  // Si on passe un ID dans la navigation, c'est le profil d'un autre. Sinon, c'est le nôtre.
  const isMyProfile = !route.params?.userId; 
  
  // 2. Logique des sous-onglets (Bibliothèque vs Activité)
  const [activeTab, setActiveTab] = useState('library'); // 'library' ou 'activity'

  if (isMyProfile && !isLoggedIn) {
    return (
      <GuestPrompt 
        icon="person-outline" 
        title="Rejoins la communauté" 
        message="Connecte-toi pour créer ton profil de joueur, gérer ta bibliothèque de jeux et te faire des amis." 
      />
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {!isMyProfile ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} /> // Espace vide pour centrer le titre
        )}
        
        <Text style={styles.headerTitle}>{isMyProfile ? "My Profile" : "Profile"}</Text>
        
        {isMyProfile ? (
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="settings" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* INFOS DU PROFIL */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }} 
              style={styles.avatar} 
            />
            <View style={styles.onlineBadge} />
          </View>
          
          <Text style={styles.name}>AlexTheGamer</Text>
          <Text style={styles.username}>@alex_fps</Text>
          <Text style={styles.bio}>
            Hardcore FPS player & RPG enthusiast. Always looking for a squad in the Gulag! 🎮 ✨
          </Text>

          {/* BOUTONS D'ACTION DYNAMIQUES */}
          <View style={styles.actionButtons}>
            {isMyProfile ? (
              <>
                <TouchableOpacity style={[styles.mainBtn, { backgroundColor: COLORS.surfaceDark }]}>
                  <MaterialIcons name="edit" size={20} color="white" />
                  <Text style={styles.mainBtnText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.circleBtn}>
                  <MaterialIcons name="share" size={20} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.mainBtn}>
                  <MaterialIcons name="person-add" size={20} color="white" />
                  <Text style={styles.mainBtnText}>Follow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.circleBtn}>
                  <MaterialIcons name="chat-bubble" size={20} color="white" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* STATISTIQUES */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>1.2k</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statNumber}>450</Text>
            <Text style={styles.statLabel}>FOLLOWING</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>89</Text>
            <Text style={styles.statLabel}>REVIEWS</Text>
          </View>
        </View>

        {/* SOUS-ONGLETS (Le choix de l'utilisateur) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'library' && styles.tabBtnActive]}
            onPress={() => setActiveTab('library')}
          >
            <Text style={[styles.tabText, activeTab === 'library' && styles.tabTextActive]}>My Games</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'activity' && styles.tabBtnActive]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>Activity</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENU CONDITIONNEL : BIBLIOTHÈQUE OU ACTIVITÉ */}
        {activeTab === 'library' ? (
          <View style={styles.tabContent}>
            {/* Liste : En cours */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Currently Playing (En cours)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 20 }}>
              <View style={styles.gameCardSmall}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1505506874110-6a7a6c9924cb?auto=format&fit=crop&w=300&q=80' }} style={styles.gameCardImg} />
                <Text style={styles.gameCardTitle} numberOfLines={1}>Call of Duty: Warzone</Text>
              </View>
              <View style={styles.gameCardSmall}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=300&q=80' }} style={styles.gameCardImg} />
                <Text style={styles.gameCardTitle} numberOfLines={1}>Elden Ring</Text>
              </View>
            </ScrollView>

            {/* Liste : Terminé */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Completed (Terminé)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
              <View style={styles.gameCardSmall}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80' }} style={styles.gameCardImg} />
                <Text style={styles.gameCardTitle} numberOfLines={1}>Cyberpunk 2077</Text>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* Design d'activité traduit de ton HTML */}
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=100&q=80' }} style={styles.activityAvatar} />
                <View>
                  <Text style={styles.activityText}>
                    <Text style={{fontWeight: 'bold', color: 'white'}}>Sarah </Text>
                    reviewed Elden Ring
                  </Text>
                  <Text style={styles.activityTime}>5 hours ago</Text>
                </View>
              </View>
              <View style={styles.activityBody}>
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  {[1,2,3,4,5].map(i => <MaterialIcons key={i} name="star" size={14} color="#facc15" />)}
                </View>
                <Text style={styles.activityReviewText}>"An absolute masterpiece. The open world design sets a new standard..."</Text>
              </View>
            </View>
          </View>
        )}

        {/* Espace pour la barre de navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 40, backgroundColor: COLORS.bgDark, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark },
  iconBtn: { padding: 8 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  profileInfo: { alignItems: 'center', padding: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: COLORS.primary },
  onlineBadge: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, backgroundColor: '#22c55e', borderRadius: 10, borderWidth: 3, borderColor: COLORS.bgDark },
  name: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  username: { color: COLORS.primary, fontSize: 14, fontWeight: '500', marginTop: 4 },
  bio: { color: COLORS.textMuted, textAlign: 'center', marginTop: 12, paddingHorizontal: 20, lineHeight: 20 },
  actionButtons: { flexDirection: 'row', marginTop: 20, gap: 12, width: '100%' },
  mainBtn: { flex: 1, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 24, gap: 8 },
  mainBtnText: { color: 'white', fontWeight: 'bold' },
  circleBtn: { width: 44, height: 44, backgroundColor: COLORS.surfaceDark, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.borderDark },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.borderDark },
  statNumber: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.borderDark },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 2, borderColor: 'transparent' },
  tabBtnActive: { borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontWeight: 'bold' },
  tabTextActive: { color: COLORS.primary },
  tabContent: { paddingTop: 20 },
  listHeader: { paddingHorizontal: 16, marginBottom: 12 },
  listTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  gameCardSmall: { width: 120, marginRight: 12 },
  gameCardImg: { width: '100%', height: 160, borderRadius: 12, marginBottom: 8 },
  gameCardTitle: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  activityCard: { backgroundColor: COLORS.surfaceDark, marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.borderDark, marginBottom: 16 },
  activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  activityAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  activityText: { color: COLORS.textMuted, fontSize: 14 },
  activityTime: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  activityBody: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 },
  activityReviewText: { color: '#d1d5db', fontSize: 13, fontStyle: 'italic' },
});
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { contentAPI } from '../services/api'; 

const RAWG_API_KEY = process.env.EXPO_PUBLIC_RAWG_API_KEY;

export default function GameListScreen({ route, navigation }) {
  const { type, platformId, title } = route.params || {};
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: title || 'Liste des jeux' });
  }, [navigation, title]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        let finalData = [];
        if (type === 'platform') {
          const response = await fetch(`https://api.rawg.io/api/games?platforms=${platformId}&ordering=-added&key=${RAWG_API_KEY}`);
          const json = await response.json();
          finalData = json.results || [];
        } else if (type === 'newreleases') {
          const response = await contentAPI.getNewReleases();
          finalData = response?.data?.results ? response.data.results : response?.data || [];
        } else {
          const response = await contentAPI.getPopular(1); 
          finalData = response?.data?.results ? response.data.results : response?.data || [];
        }
        setGames(finalData);
      } catch (error) {
        console.log(`❌ Erreur Liste :`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [type, platformId]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#eab308" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('GameDetail', { id: item.externalId || item.id })}
          >
            <Image 
              source={{ uri: item.backgroundImage || item.background_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80' }} 
              style={styles.image} 
            />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>{item.title || item.name || 'Jeu inconnu'}</Text>
              <Text style={styles.rating}>⭐ {item.rating > 0 ? item.rating : 'N/A'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0817', padding: 15 },
  centered: { flex: 1, backgroundColor: '#0f0817', justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#1e1525', marginBottom: 15, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#2d203b' },
  image: { width: 120, height: 120 },
  info: { flex: 1, padding: 15, justifyContent: 'center' },
  title: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  rating: { color: '#eab308', fontWeight: 'bold' }
});
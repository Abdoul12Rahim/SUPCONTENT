import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { newsAPI } from '../services/api';

export default function NewsListScreen({ navigation }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: 'Actualités' });
    
    newsAPI.getHeadlines()
      .then(res => {
        const data = res.data.articles || res.data || [];
        setNews(data);
        setLoading(false);
      })
      .catch(err => {
        console.log("Erreur News :", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#eab308" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={news}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(item.url)} // Ouvre l'article sur internet !
          >
            <Image source={{ uri: item.urlToImage }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={3}>{item.title}</Text>
              <Text style={styles.source}>{item.source?.name || 'Article'}</Text>
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
  image: { width: 100, height: 100 },
  info: { flex: 1, padding: 15, justifyContent: 'center' },
  title: { color: 'white', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  source: { color: '#eab308', fontSize: 12 }
});
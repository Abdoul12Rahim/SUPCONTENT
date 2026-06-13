import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { libraryAPI } from '../services/api';

const TABS = [
  { key: 'to_play', label: '📋 À jouer' },
  { key: 'playing', label: '🎮 En cours' },
  { key: 'completed', label: '✅ Terminés' },
  { key: 'dropped', label: '❌ Abandonnés' },
];

function GameRow({ item, colors, navigation }) {
  const s = styles(colors);
  return (
    <TouchableOpacity
      style={s.row}
      onPress={() => navigation.navigate('GameDetail', { game: item.content })}
    >
      {item.content?.backgroundImage ? (
        <Image source={{ uri: item.content.backgroundImage }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
          <Text>🎮</Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={s.title} numberOfLines={1}>{item.content?.title}</Text>
        {item.rating && (
          <Text style={s.rating}>⭐ {item.rating}/5</Text>
        )}
        {item.hoursPlayed > 0 && (
          <Text style={s.hours}>{item.hoursPlayed}h jouées</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function LibraryScreen({ navigation }) {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('to_play');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) fetchLibrary();
  }, [activeTab, isAuthenticated]);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await libraryAPI.getMy(activeTab);
      setGames(res.data.items || res.data.library || res.data || []);
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  if (!isAuthenticated) {
    return (
      <View style={s.center}>
        <Text style={{ color: colors.textLight }}>Connectez-vous pour voir votre bibliothèque</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>📚 Ma Bibliothèque</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <GameRow item={item} colors={colors} navigation={navigation} />
          )}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ color: colors.textLight }}>
                Aucun jeu dans "{TABS.find((t) => t.key === activeTab)?.label}"
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
    },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { fontSize: 11, color: colors.textLight },
    tabTextActive: { color: colors.primary, fontWeight: 'bold' },
    row: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 10,
      marginBottom: 8,
      alignItems: 'center',
      elevation: 1,
    },
    thumb: { width: 60, height: 60, borderRadius: 8 },
    title: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    rating: { fontSize: 12, color: colors.star, marginTop: 2 },
    hours: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  });

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { contentAPI, socialAPI, resolveMediaUrl } from '../services/api';

export default function DiscoverScreen({ navigation }) {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('jeux'); // 'jeux' | 'joueurs'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [followLoading, setFollowLoading] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'joueurs' && isAuthenticated && !query.trim()) {
      fetchSuggestions();
    }
  }, [tab, isAuthenticated, query]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await socialAPI.getSuggestions();
      setSuggestions(res.data || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text) => {
    setQuery(text);
    if (!text.trim() || text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      if (tab === 'jeux') {
        const res = await contentAPI.search(text.trim());
        setResults(res.data.results || []);
      } else {
        const res = await socialAPI.searchUsers(text.trim());
        setResults(res.data.users || res.data.results || res.data || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (item) => {
    setFollowLoading((prev) => ({ ...prev, [item._id]: true }));
    try {
      if (item.isFollowing) {
        await socialAPI.unfollow(item._id);
      } else {
        await socialAPI.follow(item._id);
      }

      const patchItem = (entry) =>
        entry._id === item._id ? { ...entry, isFollowing: !entry.isFollowing } : entry;

      setResults((prev) => prev.map(patchItem));
      setSuggestions((prev) => prev.map(patchItem));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [item._id]: false }));
    }
  };

  const s = styles(colors);

  const renderGame = ({ item }) => (
    <TouchableOpacity
      style={s.row}
      onPress={() => navigation.navigate('GameDetail', { game: item })}
    >
      {item.backgroundImage ? (
        <Image source={{ uri: item.backgroundImage }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
          <Text>🎮</Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
        {item.rating > 0 && <Text style={s.rowSub}>⭐ {item.rating?.toFixed(1)}</Text>}
      </View>
    </TouchableOpacity>
  );

  const openUserProfile = (item) => {
    navigation.navigate('UserProfile', { userId: item._id });
  };

  const renderUser = ({ item }) => (
    <View style={s.row}>
      <TouchableOpacity style={s.avatarBox} onPress={() => openUserProfile(item)}>
        {item.avatar ? (
          <Image source={{ uri: resolveMediaUrl(item.avatar) }} style={s.avatarImg} />
        ) : (
          <Text style={{ fontSize: 24 }}>👤</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => openUserProfile(item)}>
        <Text style={s.rowTitle}>{item.displayName || item.username}</Text>
        <Text style={s.rowSub}>@{item.username}</Text>
        {!!item.bio && <Text style={s.rowMeta} numberOfLines={2}>{item.bio}</Text>}
        {!!item.stats && (
          <Text style={s.rowMeta}>
            {item.stats.followersCount || 0} abonnés • {item.stats.reviewCount || 0} critiques
          </Text>
        )}
      </TouchableOpacity>
      {isAuthenticated && (
        <TouchableOpacity
          style={[s.followBtn, item.isFollowing && s.followBtnActive]}
          onPress={() => handleFollowToggle(item)}
          disabled={followLoading[item._id]}
        >
          <Text style={[s.followText, item.isFollowing && s.followTextActive]}>
            {followLoading[item._id] ? '...' : item.isFollowing ? 'Suivi' : 'Suivre'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const currentData = tab === 'joueurs' && !query.trim() ? suggestions : results;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🔍 Découvrir</Text>
      </View>

      {/* Toggle jeux / joueurs */}
      <View style={s.toggle}>
        {['jeux', 'joueurs'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.toggleBtn, tab === t && s.toggleBtnActive]}
            onPress={() => {
              setTab(t);
              setResults([]);
              setQuery('');
              if (t === 'joueurs') {
                setSuggestions([]);
              }
            }}
          >
            <Text style={[s.toggleText, tab === t && s.toggleTextActive]}>
              {t === 'jeux' ? '🎮 Jeux' : '👥 Joueurs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.searchBox}>
        <TextInput
          style={s.input}
          placeholder={tab === 'jeux' ? 'Rechercher un jeu…' : 'Rechercher un joueur…'}
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ margin: 20 }} />
      ) : tab === 'joueurs' && !isAuthenticated ? (
        <View style={s.center}>
          <Text style={{ color: colors.textLight, textAlign: 'center' }}>
            Connectez-vous pour découvrir des joueurs et gérer vos abonnements.
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => String(item._id || item.externalId)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={tab === 'jeux' ? renderGame : renderUser}
          ListEmptyComponent={
            query.length > 1 || (tab === 'joueurs' && !query.length) ? (
              <View style={s.center}>
                <Text style={{ color: colors.textLight }}>
                  {query.length > 1 ? 'Aucun résultat' : 'Aucune suggestion pour le moment'}
                </Text>
              </View>
            ) : null
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
    toggle: {
      flexDirection: 'row',
      margin: 12,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    toggleBtn: { flex: 1, padding: 10, alignItems: 'center' },
    toggleBtnActive: { backgroundColor: colors.primary },
    toggleText: { color: colors.text, fontWeight: '600' },
    toggleTextActive: { color: '#fff' },
    searchBox: {
      marginHorizontal: 12,
      marginBottom: 8,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
    },
    input: { paddingVertical: 10, color: colors.text },
    center: { alignItems: 'center', marginTop: 40 },
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
    avatarBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: 48, height: 48 },
    rowTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    rowSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    rowMeta: { fontSize: 12, color: colors.textLight, marginTop: 4 },
    followBtn: {
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    followBtnActive: {
      backgroundColor: colors.primary,
    },
    followText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
    followTextActive: { color: '#fff' },
  });

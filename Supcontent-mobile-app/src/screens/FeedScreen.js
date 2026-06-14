import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { socialAPI, reviewAPI } from '../services/api';

const ACTIVITY_LABELS = {
  review: 'a posté une critique',
  library_add: 'a ajouté à sa bibliothèque',
  follow: 'a suivi',
  like: 'a aimé',
  comment: 'a commenté',
};

function ActivityItem({ item, colors, navigation }) {
  const s = styles(colors);
  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.avatar}>
          {item.user?.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={s.avatarImg} />
          ) : (
            <Text style={s.avatarEmoji}>👤</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.actorName}>
            {item.user?.displayName || item.user?.username}
            <Text style={s.actorAction}> {ACTIVITY_LABELS[item.type] || item.type}</Text>
          </Text>
          {item.content && (
            <TouchableOpacity onPress={() => navigation.navigate('GameDetail', { game: item.content })}>
              <Text style={s.contentTitle}>{item.content.title}</Text>
            </TouchableOpacity>
          )}
          {item.review && (
            <View style={s.reviewBox}>
              <Text style={s.reviewRating}>{'⭐'.repeat(item.review.rating)} ({item.review.rating}/5)</Text>
              <Text style={s.reviewText} numberOfLines={3}>{item.review.text}</Text>
            </View>
          )}
          <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
        </View>
      </View>
      {item.content?.backgroundImage && (
        <Image
          source={{ uri: item.content.backgroundImage }}
          style={s.contentImg}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

export default function FeedScreen({ navigation }) {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isAuthenticated) fetchFeed();
  }, [isAuthenticated]);

  const fetchFeed = async (p = 1) => {
    setLoading(p === 1);
    try {
      const res = await socialAPI.getFeed(p);
      const data = res.data.activities || res.data || [];
      setActivities(p === 1 ? data : (prev) => [...prev, ...data]);
      setPage(p);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  if (!isAuthenticated) {
    return (
      <View style={s.center}>
        <Text style={{ color: colors.textLight }}>Connectez-vous pour voir votre fil d'actualité</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>📰 Fil d'actualité</Text>
      </View>
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <ActivityItem item={item} colors={colors} navigation={navigation} />
          )}
          onEndReached={() => fetchFeed(page + 1)}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ color: colors.textLight }}>
                Aucune activité. Suivez des joueurs pour voir leur actualité !
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
    card: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      elevation: 1,
    },
    row: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: 40, height: 40 },
    avatarEmoji: { fontSize: 20 },
    actorName: { fontWeight: 'bold', color: colors.text, fontSize: 14 },
    actorAction: { fontWeight: 'normal', color: colors.textLight },
    contentTitle: { color: colors.primary, fontWeight: '600', marginTop: 2 },
    reviewBox: { marginTop: 6 },
    reviewRating: { color: colors.star, fontSize: 12 },
    reviewText: { color: colors.text, fontSize: 13, marginTop: 2 },
    date: { color: colors.textLight, fontSize: 11, marginTop: 4 },
    contentImg: { width: '100%', height: 140, borderRadius: 8, marginTop: 6 },
  });

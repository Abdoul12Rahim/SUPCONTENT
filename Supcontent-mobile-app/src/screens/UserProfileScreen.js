import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { resolveMediaUrl, reviewAPI, socialAPI, userAPI } from '../services/api';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { colors } = useTheme();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, statsRes, reviewsRes, followRes] = await Promise.all([
        userAPI.getProfile(userId),
        userAPI.getStats(userId),
        reviewAPI.getByUser(userId),
        socialAPI.checkFollowStatus(userId),
      ]);

      setProfile(profileRes.data.user || profileRes.data);
      setStats(statsRes.data || null);
      setReviews(reviewsRes.data.reviews || reviewsRes.data || []);
      setIsFollowing(!!followRes.data?.isFollowing);
    } catch {
      setProfile(null);
      setStats(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (isFollowing) {
      await socialAPI.unfollow(userId);
    } else {
      await socialAPI.follow(userId);
    }
    setIsFollowing((prev) => !prev);
  };

  const s = styles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>← Retour</Text>
          </TouchableOpacity>
          <View style={s.avatar}>
            {profile?.avatar ? (
              <Image source={{ uri: resolveMediaUrl(profile.avatar) }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarEmoji}>👤</Text>
            )}
          </View>
          <Text style={s.name}>{profile?.displayName || profile?.username}</Text>
          <Text style={s.handle}>@{profile?.username}</Text>
          {!!profile?.bio && <Text style={s.bio}>{profile.bio}</Text>}

          <View style={s.statsRow}>
            <Text style={s.stat}>{stats?.libraryCount || 0} jeux</Text>
            <Text style={s.stat}>{stats?.reviewCount || 0} critiques</Text>
            <Text style={s.stat}>{stats?.followersCount || 0} abonnés</Text>
          </View>

          <TouchableOpacity style={[s.followBtn, isFollowing && s.followBtnActive]} onPress={toggleFollow}>
            <Text style={[s.followText, isFollowing && s.followTextActive]}>
              {isFollowing ? 'Ne plus suivre' : 'Suivre'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 12 }}>
          <Text style={s.sectionTitle}>Critiques récentes</Text>
          {reviews.length > 0 ? (
            reviews.slice(0, 10).map((review) => (
              <View key={review._id} style={s.reviewCard}>
                <Text style={s.reviewGame}>{review.content?.title}</Text>
                <Text style={s.reviewRating}>{'★'.repeat(review.rating || 0)}</Text>
                <Text style={s.reviewText}>{review.text}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textLight }}>Aucune critique disponible.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      padding: 16,
      alignItems: 'center',
    },
    back: { alignSelf: 'flex-start', color: colors.primary, fontWeight: '700', marginBottom: 12 },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: 10,
    },
    avatarImg: { width: 88, height: 88 },
    avatarEmoji: { fontSize: 38 },
    name: { color: colors.text, fontSize: 22, fontWeight: '700' },
    handle: { color: colors.textLight, marginTop: 4 },
    bio: { color: colors.text, marginTop: 8, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
    stat: { color: colors.textLight, fontSize: 12 },
    followBtn: {
      marginTop: 14,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    followBtnActive: { backgroundColor: colors.primary },
    followText: { color: colors.primary, fontWeight: '700' },
    followTextActive: { color: '#fff' },
    sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 10 },
    reviewCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    reviewGame: { color: colors.text, fontWeight: '700', marginBottom: 4 },
    reviewRating: { color: colors.star, marginBottom: 6 },
    reviewText: { color: colors.textLight },
  });
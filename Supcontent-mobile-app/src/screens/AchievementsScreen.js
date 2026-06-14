import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { achievementAPI } from '../services/api';

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const [statsRes, achievementsRes] = await Promise.all([
        achievementAPI.getMyStats(),
        achievementAPI.getMy(),
      ]);
      setStats(statsRes.data || null);
      setAchievements(achievementsRes.data || []);
    } catch {
      setStats(null);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>🏆 Achievements</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={achievements}
          keyExtractor={(item) => item.achievement?._id || item._id}
          contentContainerStyle={{ padding: 12 }}
          ListHeaderComponent={
            stats ? (
              <View style={s.statsBox}>
                <Text style={s.statsText}>{stats.unlockedCount} / {stats.totalAchievements} débloqués</Text>
                <Text style={s.statsText}>{stats.totalPoints} points • {Math.round(stats.completionRate)}%</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[s.card, item.isUnlocked && s.cardUnlocked]}>
              <Text style={s.icon}>{item.achievement?.icon || '🏅'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.achievement?.name}</Text>
                <Text style={s.desc}>{item.achievement?.description}</Text>
                <Text style={s.meta}>
                  {item.achievement?.rarity} • {item.achievement?.points} pts • progression {item.progress}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ color: colors.textLight }}>Aucun achievement chargé</Text>
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
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: { color: colors.primary, fontSize: 20, fontWeight: '700' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    statsBox: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    statsText: { color: colors.text, fontWeight: '600', marginBottom: 4 },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      flexDirection: 'row',
      gap: 12,
    },
    cardUnlocked: { borderColor: colors.success },
    icon: { fontSize: 28 },
    name: { color: colors.text, fontWeight: '700', marginBottom: 4 },
    desc: { color: colors.textLight, marginBottom: 6 },
    meta: { color: colors.primary, fontSize: 12 },
  });
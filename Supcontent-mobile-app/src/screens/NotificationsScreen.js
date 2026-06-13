import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { notificationAPI } from '../services/api';

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    await notificationAPI.markAllAsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const toggleRead = async (item) => {
    if (item.isRead) {
      await notificationAPI.markAsUnread(item._id);
    } else {
      await notificationAPI.markAsRead(item._id);
    }

    setNotifications((prev) =>
      prev.map((entry) =>
        entry._id === item._id ? { ...entry, isRead: !entry.isRead } : entry
      )
    );
  };

  const deleteNotification = async (id) => {
    await notificationAPI.delete(id);
    setNotifications((prev) => prev.filter((entry) => entry._id !== id));
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>🔔 Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={s.headerAction}>Tout lire</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.card, !item.isRead && s.cardUnread]}
              onPress={() => item.from?._id && navigation.navigate('UserProfile', { userId: item.from._id })}
            >
              <Text style={s.message}>{item.from?.displayName || item.from?.username || 'Quelqu\'un'} {item.message}</Text>
              <Text style={s.meta}>{item.type} • {new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
              <View style={s.actions}>
                <TouchableOpacity onPress={() => toggleRead(item)}>
                  <Text style={s.actionText}>{item.isRead ? 'Marquer non lu' : 'Marquer lu'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteNotification(item._id)}>
                  <Text style={[s.actionText, { color: colors.error }]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ color: colors.textLight }}>Aucune notification</Text>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: { color: colors.primary, fontSize: 20, fontWeight: '700' },
    headerAction: { color: colors.primary, fontWeight: '600' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 10,
    },
    cardUnread: { borderColor: colors.primary },
    message: { color: colors.text, fontWeight: '600', marginBottom: 6 },
    meta: { color: colors.textLight, fontSize: 12 },
    actions: { flexDirection: 'row', gap: 16, marginTop: 10 },
    actionText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  });
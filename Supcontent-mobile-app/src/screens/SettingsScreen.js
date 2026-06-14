import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

export default function SettingsScreen() {
  const theme = useTheme();
  const { colors, isDark, toggleTheme } = theme;
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUsername(user?.username || '');
    setDisplayName(user?.displayName || '');
    setBio(user?.bio || '');
  }, [user]);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({ username, displayName, bio });
      updateUser(res.data);
      Alert.alert('Succès', 'Profil mis à jour.');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Remplissez tous les champs du mot de passe.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Succès', 'Mot de passe modifié.');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de changer le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.title}>⚙️ Paramètres</Text>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Profil</Text>
          <TextInput style={s.input} value={username} onChangeText={setUsername} placeholder="Nom d'utilisateur" placeholderTextColor={colors.textLight} />
          <TextInput style={s.input} value={displayName} onChangeText={setDisplayName} placeholder="Nom affiché" placeholderTextColor={colors.textLight} />
          <TextInput style={[s.input, s.textArea]} value={bio} onChangeText={setBio} placeholder="Bio" placeholderTextColor={colors.textLight} multiline />
          <TouchableOpacity style={s.primaryBtn} onPress={saveProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Enregistrer le profil</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Mot de passe</Text>
          <TextInput style={s.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Mot de passe actuel" placeholderTextColor={colors.textLight} secureTextEntry />
          <TextInput style={s.input} value={newPassword} onChangeText={setNewPassword} placeholder="Nouveau mot de passe" placeholderTextColor={colors.textLight} secureTextEntry />
          <TextInput style={s.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirmer le mot de passe" placeholderTextColor={colors.textLight} secureTextEntry />
          <TouchableOpacity style={s.secondaryBtn} onPress={changePassword} disabled={loading}>
            <Text style={s.secondaryBtnText}>Changer le mot de passe</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Préférences</Text>
          <View style={s.switchRow}>
            <Text style={s.switchLabel}>Mode sombre</Text>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    title: { color: colors.primary, fontSize: 22, fontWeight: '700', marginBottom: 16 },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    sectionTitle: { color: colors.text, fontWeight: '700', marginBottom: 10, fontSize: 16 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      backgroundColor: colors.bg,
      color: colors.text,
      marginBottom: 10,
    },
    textArea: { minHeight: 90, textAlignVertical: 'top' },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontWeight: '700' },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
    },
    secondaryBtnText: { color: colors.primary, fontWeight: '700' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    switchLabel: { color: colors.text, fontWeight: '600' },
  });
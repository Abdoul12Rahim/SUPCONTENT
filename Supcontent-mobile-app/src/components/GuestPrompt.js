import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#8a2ce2', bgDark: '#191121', textMuted: '#94a3b8', surfaceDark: '#241a30'
};
// Composant générique pour inviter les utilisateurs non connectés à se connecter ou s'inscrire lorsqu'ils essaient d'accéder à des pages protégées (profil, messages, salons, etc.)
export default function GuestPrompt({ icon, title, message }) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.iconBg}>
        <MaterialIcons name={icon} size={60} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {/* Ce bouton enverra l'utilisateur vers ton LoginScreen */}
      <TouchableOpacity 
        style={styles.loginBtn}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginBtnText}>Se connecter ou s'inscrire</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(138, 44, 226, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(138, 44, 226, 0.3)' },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  message: { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  loginBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
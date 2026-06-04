import React, { useState, useContext } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity,
  ImageBackground, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const COLORS = {
  primary: '#7c3aed',
  bgDark: '#0d0d14',
  surface: '#13131f',
  textMuted: '#64748b',
  textLight: '#f1f5f9',
  border: 'rgba(255,255,255,0.06)',
};

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    // Validations côté client
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Veuillez remplir tous les champs.');
      return;
    }
    if (username.trim().length < 3) {
      setErrorMessage("Le nom d'utilisateur doit faire au moins 3 caractères.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Adresse email invalide.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    const result = await register(username.trim(), email.trim(), password);
    setIsLoading(false);

    if (result.success) {
      navigation.navigate('MainTabs');
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80' }}
        style={styles.bg}
        imageStyle={{ opacity: 0.3 }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              <View style={styles.header}>
                <Text style={styles.title}>Créer un compte</Text>
                <Text style={styles.subtitle}>Rejoins la communauté de gamers et gère ta bibliothèque.</Text>
              </View>

              <View style={styles.form}>
                {/* Username */}
                <View style={styles.inputWrap}>
                  <MaterialIcons name="person" size={18} color={COLORS.textMuted} style={{ marginRight: 12 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nom d'utilisateur"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>

                {/* Email */}
                <View style={styles.inputWrap}>
                  <MaterialIcons name="email" size={18} color={COLORS.textMuted} style={{ marginRight: 12 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="Adresse email"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputWrap}>
                  <MaterialIcons name="lock" size={18} color={COLORS.textMuted} style={{ marginRight: 12 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mot de passe (min. 6 caractères)"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputWrap}>
                  <MaterialIcons name="lock-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 12 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    {[1, 2, 3].map(i => (
                      <View key={i} style={[
                        styles.strengthBar,
                        {
                          backgroundColor: password.length >= i * 4
                            ? (password.length >= 10 ? '#10b981' : COLORS.primary)
                            : COLORS.border
                        }
                      ]} />
                    ))}
                    <Text style={styles.strengthLabel}>
                      {password.length < 4 ? 'Faible' : password.length < 8 ? 'Moyen' : 'Fort'}
                    </Text>
                  </View>
                )}

                {/* Error */}
                {errorMessage !== '' && (
                  <View style={styles.errorBox}>
                    <MaterialIcons name="error-outline" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Register button */}
                <TouchableOpacity
                  style={[styles.registerBtn, isLoading && { opacity: 0.7 }]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.registerBtnText}>CRÉER MON COMPTE</Text>
                  }
                </TouchableOpacity>

                {/* Terms */}
                <Text style={styles.termsText}>
                  En créant un compte, tu acceptes nos{' '}
                  <Text style={{ color: COLORS.primary }}>Conditions d'utilisation</Text>
                  {' '}et notre{' '}
                  <Text style={{ color: COLORS.primary }}>Politique de confidentialité</Text>.
                </Text>

                {/* Login link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Déjà un compte ? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.footerLink}>Se connecter</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(13,13,20,0.88)' },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 20, zIndex: 100, backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  header: { marginBottom: 32, marginTop: 90 },
  title: { color: COLORS.textLight, fontSize: 28, fontWeight: '900' },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 6, lineHeight: 20 },
  form: { width: '100%' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14,
    paddingHorizontal: 16, height: 56, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  input: { flex: 1, color: COLORS.textLight, fontSize: 15 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', minWidth: 40 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  errorText: { color: '#ef4444', fontSize: 13, flex: 1 },
  registerBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8 },
  registerBtnText: { color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
  termsText: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
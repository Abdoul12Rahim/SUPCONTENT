import React, { useState, useContext } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity,
  ImageBackground, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
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

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Veuillez remplir tous les champs.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    const result = await login(email.trim(), password);
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
        source={{ uri: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80' }}
        style={styles.bg}
        imageStyle={{ opacity: 0.35 }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              <View style={styles.header}>
                <View style={styles.logoWrap}>
                  <MaterialIcons name="videogame-asset" size={36} color="white" />
                </View>
                <Text style={styles.title}>Content</Text>
                <Text style={styles.subtitle}>Retrouve ton squad et plonge dans l'action.</Text>
              </View>

              <View style={styles.form}>
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
                    placeholder="Mot de passe"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotWrap}>
                  <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>

                {/* Error */}
                {errorMessage !== '' && (
                  <View style={styles.errorBox}>
                    <MaterialIcons name="error-outline" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Login button */}
                <TouchableOpacity
                  style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.loginBtnText}>SE CONNECTER</Text>
                  }
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OU</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* OAuth */}
                <View style={styles.oauthRow}>
                  <TouchableOpacity style={styles.oauthBtn} onPress={() => Alert.alert('Google OAuth', 'Disponible après déploiement.')}>
                    <Text style={styles.oauthBtnText}>G</Text>
                    <Text style={styles.oauthLabel}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.oauthBtn} onPress={() => Alert.alert('GitHub OAuth', 'Disponible après déploiement.')}>
                    <MaterialIcons name="code" size={20} color="white" />
                    <Text style={styles.oauthLabel}>GitHub</Text>
                  </TouchableOpacity>
                </View>

                {/* Register link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Pas encore de compte ? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.footerLink}>Créer un compte</Text>
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
  closeBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 20, zIndex: 100, backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 36, marginTop: 80 },
  logoWrap: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 22, marginBottom: 14, shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 12 },
  title: { color: COLORS.textLight, fontSize: 30, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
  form: { width: '100%' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14,
    paddingHorizontal: 16, height: 56, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  input: { flex: 1, color: COLORS.textLight, fontSize: 15 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  errorText: { color: '#ef4444', fontSize: 13, flex: 1 },
  loginBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8 },
  loginBtnText: { color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, paddingHorizontal: 14, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  oauthRow: { flexDirection: 'row', gap: 14, marginBottom: 32 },
  oauthBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 14, height: 52, borderWidth: 1, borderColor: COLORS.border },
  oauthBtnText: { color: 'white', fontSize: 20, fontWeight: '800' },
  oauthLabel: { color: COLORS.textLight, fontWeight: '600', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
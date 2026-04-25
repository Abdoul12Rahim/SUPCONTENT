import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#8a2ce2', bgDark: '#191121', surfaceDark: '#241a30', textMuted: '#94a3b8', accentBlue: '#00d4ff',
};

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = () => {
    console.log("Tentative d'inscription pour :", username);
    // Plus tard : appel à ton backend pour créer le compte
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80' }} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.3 }}
      >
        <View style={styles.overlay}>
          {/* Bouton Retour */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              <View style={styles.header}>
                <Text style={styles.title}>Join GamerFlow</Text>
                <Text style={styles.subtitle}>Create an account to track your games and connect with friends.</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Champ Username */}
                <View style={styles.inputGroup}>
                  <MaterialIcons name="person" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} placeholder="Username" placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none" value={username} onChangeText={setUsername}
                  />
                </View>

                {/* Champ Email */}
                <View style={styles.inputGroup}>
                  <MaterialIcons name="email" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} placeholder="Email Address" placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail}
                  />
                </View>

                {/* Champ Mot de passe */}
                <View style={styles.inputGroup}>
                  <MaterialIcons name="lock" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} placeholder="Password" placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword} value={password} onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Champ Confirmer Mot de passe */}
                <View style={styles.inputGroup}>
                  <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} placeholder="Confirm Password" placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword} value={confirmPassword} onChangeText={setConfirmPassword}
                  />
                </View>

                {/* Bouton d'inscription */}
                <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
                  <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
                </TouchableOpacity>

                {/* Lien vers la connexion */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginText}>Login here</Text>
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
  backgroundImage: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(25, 17, 33, 0.85)' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, left: 24, zIndex: 100, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  header: { marginBottom: 40, marginTop: 80 },
  title: { color: 'white', fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  formContainer: { width: '100%' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceDark, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 60, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: 'white', fontSize: 16 },
  eyeIcon: { padding: 8 },
  registerBtn: { backgroundColor: COLORS.primary, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  registerBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  loginText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
});
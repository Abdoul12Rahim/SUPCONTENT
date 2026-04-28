import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
const COLORS = {
  primary: '#8a2ce2',
  bgDark: '#191121',
  surfaceDark: '#241a30',
  textMuted: '#94a3b8',
  accentBlue: '#00d4ff',
};
// Page de connexion, avec formulaire et intégration de l'API d'authentification
export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState(''); 

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Veuillez remplir tous les champs");
      return;
    }

    setErrorMessage(''); 
    console.log("Tentative de connexion avec :", email);
    
    
    const result = await login(email, password);
    
    if (result.success) {
      
      navigation.navigate('MainTabs'); 
    } else {
      
      setErrorMessage(result.message);
    }
  };
    //
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80' }} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.4 }}
      >
        <View style={styles.overlay}>
          {/* 1. LE BOUTON RETOUR EST FIXÉ ICI, EN DEHORS DE LA ZONE QUI BOUGE */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={28} color="white" />
          </TouchableOpacity>

          {/* 2. LE CLAVIER ET LE SCROLL */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled" // Permet de cliquer sur "Login" pour fermer le clavier
            >
              
              <View style={styles.header}>
                <View style={styles.logoIconBg}>
                  <MaterialIcons name="videogame-asset" size={40} color="white" />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Enter the Nexus and join your squad.</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <MaterialIcons name="email" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <MaterialIcons name="lock" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                  <Text style={styles.loginBtnText}>LOGIN</Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialBtn}>
                    <Text style={styles.socialBtnText}>G</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialBtn}>
                    <MaterialIcons name="facebook" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>New to GamerFlow? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                 <Text style={styles.registerText}>Create Account</Text>
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
// Styles pour la page de connexion
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  backgroundImage: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(25, 17, 33, 0.85)' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  
  // Correction de la position du bouton retour
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, left: 24, zIndex: 100, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  
  header: { alignItems: 'center', marginBottom: 40, marginTop: 80 }, 
  logoIconBg: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 24, marginBottom: 16, shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  title: { color: 'white', fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  formContainer: { width: '100%' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceDark, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 60, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: 'white', fontSize: 16 },
  eyeIcon: { padding: 8 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: COLORS.accentBlue, fontSize: 14, fontWeight: 'bold' },
  loginBtn: { backgroundColor: COLORS.primary, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: COLORS.textMuted, paddingHorizontal: 16, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 40 },
  socialBtn: { width: 60, height: 60, backgroundColor: COLORS.surfaceDark, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  socialBtnText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  registerText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
});
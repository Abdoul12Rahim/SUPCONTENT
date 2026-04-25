import React from 'react';
import { StyleSheet, Text, SafeAreaView } from 'react-native';

const COLORS = { bgDark: '#191121', primary: '#8a2ce2' };

export default function GamesScreen() { // <-- Change ce nom pour RoomsScreen, MessagesScreen, etc.
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Page des Jeux  messages (Bientôt !)</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' },
  text: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#8a2ce2',
  textMuted: '#94a3b8',
  panelBg: 'rgba(138, 44, 226, 0.05)',
  panelBorder: 'rgba(138, 44, 226, 0.2)',
};

// On associe chaque nom de route à son icône
const ICONS = {
  Home: 'home',
  Games: 'sports-esports',
  Rooms: 'groups',
  Messages: 'chat-bubble-outline',
  Profile: 'person-outline',
};

// state et navigation sont fournis automatiquement par React Navigation
export default function BottomNav({ state, navigation }) {
  return (
    <View style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconName = ICONS[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // Si on n'est pas déjà sur la page, on y va 
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity 
            key={index} 
            style={styles.navItem} 
            onPress={onPress}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={iconName} 
              size={28} 
              color={isFocused ? COLORS.primary : COLORS.textMuted} 
            />
            <Text style={[styles.navText, { color: isFocused ? COLORS.primary : COLORS.textMuted }]}>
              {route.name}
            </Text>
            {/* Le petit point violet qui s'affiche sous l'icône active */}
            {isFocused && <View style={styles.navActiveDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.panelBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.panelBorder,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 24, 
  },
  navItem: { alignItems: 'center', width: 60 },
  navText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 4 },
  navActiveDot: { width: 4, height: 4, backgroundColor: COLORS.primary, borderRadius: 2, marginTop: 4 }
});
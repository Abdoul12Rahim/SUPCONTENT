import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../screens/RegisterScreen';
import BottomNav from '../components/BottomNav';

// les écrans
import HomeScreen from '../screens/HomeScreen';
import GamesScreen from '../screens/GamesScreen';
import RoomsScreen from '../screens/RoomsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GameDetailScreen from '../screens/GameDetailScreen'; 
import LoginScreen from '../screens/LoginScreen';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. On regroupe les 5 onglets dans un composant
function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <BottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Games" component={GamesScreen} />
      <Tab.Screen name="Rooms" component={RoomsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 2. Le navigateur principal gère les onglets ET les pages plein écran
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Les onglets de base */}
        <Stack.Screen name="MainTabs" component={MainTabs} />
        {/* La page de détails (qui n'aura pas la barre du bas) */}
        <Stack.Screen name="GameDetail" component={GameDetailScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
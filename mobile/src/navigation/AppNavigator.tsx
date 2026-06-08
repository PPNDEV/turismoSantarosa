import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

import EditorNavigator from './EditorNavigator';
import TouristNavigator from './TouristNavigator';
import AdminNavigator from './AdminNavigator';

import UnverifiedScreen from '../screens/UnverifiedScreen';

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { darkMode } = usePreferences();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={darkMode ? DarkTheme : DefaultTheme}>
      {!user ? (
        <TouristNavigator />
      ) : user.role === 'unverified' ? (
        <UnverifiedScreen />
      ) : user.role === 'administrador' ? (
        <AdminNavigator />
      ) : user.role === 'editor' ? (
        <EditorNavigator />
      ) : (
        // Turista / Visitante (Rol: visualizador)
        <TouristNavigator />
      )}
    </NavigationContainer>
  );
}

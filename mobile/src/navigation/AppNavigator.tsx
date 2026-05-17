import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import AuthNavigator from './AuthNavigator';
import EditorNavigator from './EditorNavigator';
import TouristNavigator from './TouristNavigator';
import AdminNavigator from './AdminNavigator';

import UnverifiedScreen from '../screens/UnverifiedScreen';

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
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

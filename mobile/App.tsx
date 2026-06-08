import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider, usePreferences } from './src/context/PreferencesContext';
import { TourismContentProvider } from './src/context/TourismContentContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/locales/i18n'; // Inicializar traducciones

function AppShell() {
  const { darkMode } = usePreferences();

  return (
    <>
      <AppNavigator />
      <StatusBar style={darkMode ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PreferencesProvider>
          <TourismContentProvider>
            <AppShell />
          </TourismContentProvider>
        </PreferencesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TouristHomeScreen from '../screens/tourist/TouristHomeScreen';
import TouristMapScreen from '../screens/tourist/TouristMapScreen';
import QRScannerScreen from '../screens/tourist/QRScannerScreen';
import TouristFavoritesScreen from '../screens/tourist/TouristFavoritesScreen';
import CatalogScreen from '../screens/tourist/CatalogScreen';
import PlaceDetailsScreen from '../screens/tourist/PlaceDetailsScreen';
import LoginScreen from '../screens/LoginScreen';
import TouristSettingsScreen from '../screens/tourist/TouristSettingsScreen';
import { usePreferences } from '../context/PreferencesContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TouristTabs() {
  const { darkMode, language } = usePreferences();
  const tabBackground = darkMode ? '#0f172a' : '#ffffff';
  const tabBorder = darkMode ? '#1e293b' : '#e2e8f0';
  const labels = {
    es: {
      Inicio: 'Inicio',
      'Catálogo': 'Catálogo',
      Mapa: 'Mapa',
      Favoritos: 'Favoritos',
      QR: 'QR',
      Ajustes: 'Ajustes',
    },
    en: {
      Inicio: 'Home',
      'Catálogo': 'Catalog',
      Mapa: 'Map',
      Favoritos: 'Favorites',
      QR: 'QR',
      Ajustes: 'Settings',
    },
    pt: {
      Inicio: 'Início',
      'Catálogo': 'Catálogo',
      Mapa: 'Mapa',
      Favoritos: 'Favoritos',
      QR: 'QR',
      Ajustes: 'Ajustes',
    },
  }[language];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0891b2',
        tabBarInactiveTintColor: darkMode ? '#cbd5e1' : '#64748b',
        tabBarStyle: {
          height: 66,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: tabBackground,
          borderTopColor: tabBorder,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
        tabBarLabel: labels[route.name as keyof typeof labels] ?? route.name,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Inicio: 'home-outline',
            'Catálogo': 'search-outline',
            Mapa: 'map-outline',
            Favoritos: 'heart-outline',
            QR: 'qr-code-outline',
            Ajustes: 'settings-outline',
          };

          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={TouristHomeScreen} />
      <Tab.Screen name="Catálogo" component={CatalogScreen} />
      <Tab.Screen name="Mapa" component={TouristMapScreen} />
      <Tab.Screen name="Favoritos" component={TouristFavoritesScreen} />
      <Tab.Screen name="QR" component={QRScannerScreen} />
      <Tab.Screen name="Ajustes" component={TouristSettingsScreen} />
    </Tab.Navigator>
  );
}

export default function TouristNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TouristTabs"
        component={TouristTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlaceDetailsScreen"
        component={PlaceDetailsScreen}
        options={{ title: 'Detalle turístico' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Acceso a negocios' }}
      />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TouristMapScreen from '../screens/tourist/TouristMapScreen';
import QRScannerScreen from '../screens/tourist/QRScannerScreen';
import TouristFavoritesScreen from '../screens/tourist/TouristFavoritesScreen';
import CatalogScreen from '../screens/tourist/CatalogScreen';
import PlaceDetailsScreen from '../screens/tourist/PlaceDetailsScreen';

const Stack = createNativeStackNavigator();

export default function TouristNavigator() {
  return (
    <Stack.Navigator initialRouteName="TouristMapScreen">
      <Stack.Screen 
        name="TouristMapScreen" 
        component={TouristMapScreen} 
        options={{ title: 'Explorar' }} 
      />
      <Stack.Screen 
        name="CatalogScreen" 
        component={CatalogScreen} 
        options={{ title: 'Catálogo' }} 
      />
      <Stack.Screen 
        name="QRScannerScreen" 
        component={QRScannerScreen} 
        options={{ title: 'Escanear Código' }} 
      />
      <Stack.Screen 
        name="PlaceDetailsScreen" 
        component={PlaceDetailsScreen} 
        options={{ title: 'Detalles' }} 
      />
      <Stack.Screen 
        name="TouristFavoritesScreen" 
        component={TouristFavoritesScreen} 
        options={{ title: 'Favoritos' }} 
      />
    </Stack.Navigator>
  );
}

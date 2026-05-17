import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminContenidoScreen from '../screens/admin/AdminContenidoScreen';
import GenericAdminScreen from '../screens/admin/GenericAdminScreen';
import AdminMensajesScreen from '../screens/admin/AdminMensajesScreen';
import AdminUsuariosScreen from '../screens/admin/AdminUsuariosScreen';
import AdminSolicitudesScreen from '../screens/admin/AdminSolicitudesScreen';
import ValidateAccountsScreen from '../screens/admin/ValidateAccountsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ContenidoStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ContenidoList" component={AdminContenidoScreen} />
      <Stack.Screen name="GenericAdminScreen" component={GenericAdminScreen} />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminSolicitudesScreen" component={AdminSolicitudesScreen} />
      <Stack.Screen name="ValidateAccountsScreen" component={ValidateAccountsScreen} />
    </Stack.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Contenido') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Mensajes') iconName = focused ? 'mail' : 'mail-outline';
          else if (route.name === 'Usuarios') iconName = focused ? 'people' : 'people-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1a472a',
        tabBarInactiveTintColor: 'gray',
        headerShown: false
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardStack} />
      <Tab.Screen name="Contenido" component={ContenidoStack} />
      <Tab.Screen name="Mensajes" component={AdminMensajesScreen} />
      <Tab.Screen name="Usuarios" component={AdminUsuariosScreen} />
    </Tab.Navigator>
  );
}

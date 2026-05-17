import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardEditor from '../screens/editor/DashboardEditor';
import CreateContentScreen from '../screens/editor/CreateContentScreen';

const Stack = createNativeStackNavigator();

export default function EditorNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardEditor">
      <Stack.Screen 
        name="DashboardEditor" 
        component={DashboardEditor} 
        options={{ title: 'Mis Publicaciones' }} 
      />
      <Stack.Screen 
        name="CreateContentScreen" 
        component={CreateContentScreen} 
        options={{ title: 'Crear Contenido' }} 
      />
    </Stack.Navigator>
  );
}

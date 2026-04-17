import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SQLiteProvider } from 'expo-sqlite';

import SplashScreen from './src/screens/client/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import MenuScreen from './src/screens/client/MenuScreen';
import OrderBuilderScreen from './src/screens/client/OrderBuilderScreen';
import DashboardScreen from './src/screens/employee/DashboardScreen';
import { initializeDatabase } from './src/database/schema';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SQLiteProvider databaseName="reino_das_tirinhas.db" onInit={initializeDatabase}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="OrderBuilder" component={OrderBuilderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SQLite from 'expo-sqlite';

import SplashScreen from './src/screens/client/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import EmployeeLoginScreen from './src/screens/auth/EmployeeLoginScreen';
import MenuScreen from './src/screens/client/MenuScreen';
import OrderBuilderScreen from './src/screens/client/OrderBuilderScreen';
import DashboardScreen from './src/screens/employee/DashboardScreen';
import { initializeDatabase } from './src/database/schema';

const Stack = createNativeStackNavigator();

export default function App() {
  
  useEffect(() => {
    // Inicialização do Banco de Dados ao abrir o App
    const initDb = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('reino_das_tirinhas.db');
        await initializeDatabase(db);
        console.log('Database and Seeding confirmed');
      } catch (e) {
        console.error(e);
      }
    };
    initDb();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="EmployeeLogin" component={EmployeeLoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="OrderBuilder" component={OrderBuilderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

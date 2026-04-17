import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SQLite from 'expo-sqlite';
import SplashScreen from './src/screens/client/SplashScreen';
import { initializeDatabase } from './src/database/schema';

// Stack param list pode ser adicionado depois
const Stack = createNativeStackNavigator();

export default function App() {
  
  useEffect(() => {
    // Inicialização do Banco de Dados ao abrir o App
    const initDb = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('reino_das_tirinhas.db');
        await initializeDatabase(db);
        console.log('Database started');
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
        {/* Futuras telas de Cardápio e Dashboard serão inseridas aqui */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/client/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import MenuScreen from './src/screens/client/MenuScreen';
import OrderBuilderScreen from './src/screens/client/OrderBuilderScreen';
import AcompanhamentoOrderScreen from './src/screens/client/AcompanhamentoOrderScreen';
import BarcaOrderScreen from './src/screens/client/BarcaOrderScreen';
import BebidaOrderScreen from './src/screens/client/BebidaOrderScreen';
import MyOrdersScreen from './src/screens/client/MyOrdersScreen';
import DashboardScreen from './src/screens/employee/DashboardScreen';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 280,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="OrderBuilder" component={OrderBuilderScreen} />
        <Stack.Screen name="AcompanhamentoOrder" component={AcompanhamentoOrderScreen} />
        <Stack.Screen name="BarcaOrder" component={BarcaOrderScreen} />
        <Stack.Screen name="BebidaOrder" component={BebidaOrderScreen} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

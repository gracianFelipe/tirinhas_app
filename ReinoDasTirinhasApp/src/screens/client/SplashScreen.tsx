import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Image, View } from 'react-native';
import { theme } from '../../constants/theme';

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Redireciona para o Login de clientes e funcionário
      setTimeout(() => navigation.replace('Login'), 1200);
    });
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.content, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        {/* Referenciando logo2.jpg para forçar que o Expo quebre o cache antigo e leia sua nova imagem */}
        <Image 
          source={require('../../../assets/logo2.jpg')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Volta a usar a cor constante do theme.js (que você inteligentemente cravou pra #f6efdd)
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    // Imagem ganha um pouquinho mais de espaço para ficar fluida e parecer nativa
    width: 380,
    height: 380,
  },
});

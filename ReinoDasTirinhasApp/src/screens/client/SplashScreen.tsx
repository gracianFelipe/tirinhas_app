import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { theme } from '../../constants/theme';

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Revelar logo e textos simultaneamente com animação Gourmet
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Como ainda não existe a tela 'Home', ele ficará parado no Splash por enquanto.
      // Futuramente: setTimeout(() => navigation.replace('Home'), 1500)
    });
  }, [fadeAnim, slideAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.content, 
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        
        {/* Renderiza a logo importada com base na análise visual */}
        <View style={styles.imageContainer}>
          <Image 
            source={require('../../../assets/logo.jpg')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>

        {/* Título Principal */}
        <Text style={styles.title}>REINO DAS TIRINHAS</Text>
        
        {/* Linha Divisória Clássica */}
        <View style={styles.divider} />
        
        {/* Subtítulo Gourmet */}
        <Text style={styles.subtitle}>QUENTE • CROCANTE • DELICIOSO</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '85%',
  },
  imageContainer: {
    marginBottom: 24,
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 27,
    // Em React Native mobile, 'serif' busca a fonte com serifa padrão do sistema.
    fontFamily: 'serif',
    color: theme.colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 6,
  },
  divider: {
    height: 1.5,
    width: '100%',
    backgroundColor: theme.colors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textPrimary,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});

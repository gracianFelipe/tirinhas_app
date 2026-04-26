import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Image, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { RootStackParamList, User, UserRole } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

interface ProfileRow {
  id: string;
  name: string;
  phone: string | null;
  role: UserRole;
}

const SPLASH_DURATION = 1200; // ms mínimo na splash
const SESSION_TIMEOUT = 5000;  // desiste de esperar o Supabase após 5s

export default function SplashScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const navigated = useRef(false); // evita navegar duas vezes

  const goTo = (route: 'Login' | 'Menu' | 'Dashboard', user?: User) => {
    if (navigated.current) return;
    navigated.current = true;

    if (route === 'Dashboard' && user) {
      navigation.replace('Dashboard', { user });
    } else if (route === 'Menu' && user) {
      navigation.replace('Menu', { user });
    } else {
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Tempo mínimo na Splash antes de navegar
    const minTimer = setTimeout(() => {
      checkSession();
    }, SPLASH_DURATION);

    // Fallback: se Supabase travar, vai para Login depois de 5s
    const fallbackTimer = setTimeout(() => {
      console.warn('Splash: timeout ao verificar sessão, indo para Login.');
      goTo('Login');
    }, SESSION_TIMEOUT);

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          clearTimeout(fallbackTimer);
          goTo('Login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, name, phone, role')
          .eq('id', session.user.id)
          .single<ProfileRow>();

        clearTimeout(fallbackTimer);

        if (error || !profile) {
          await supabase.auth.signOut();
          goTo('Login');
          return;
        }

        const user: User = {
          id: profile.id,
          email: session.user.email ?? '',
          name: profile.name,
          phone: profile.phone,
          role: profile.role,
        };

        goTo(profile.role === 'employee' ? 'Dashboard' : 'Menu', user);
      } catch (err) {
        console.error('Splash checkSession error:', err);
        clearTimeout(fallbackTimer);
        goTo('Login');
      }
    };

    return () => {
      clearTimeout(minTimer);
      clearTimeout(fallbackTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
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
    width: 380,
    height: 380,
  },
});

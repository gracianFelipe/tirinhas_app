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

export default function SplashScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const routeAfterAnimation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigation.replace('Login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name, phone, role')
        .eq('id', session.user.id)
        .single<ProfileRow>();

      if (error || !profile) {
        await supabase.auth.signOut();
        navigation.replace('Login');
        return;
      }

      const user: User = {
        id: profile.id,
        email: session.user.email ?? '',
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
      };

      if (user.role === 'employee') {
        navigation.replace('Dashboard', { user });
      } else {
        navigation.replace('Menu', { user });
      }
    };

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
      setTimeout(routeAfterAnimation, 1200);
    });
  }, [fadeAnim, scaleAnim, navigation]);

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

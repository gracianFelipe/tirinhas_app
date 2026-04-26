import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LoyaltyInfo } from '../utils/loyalty';

interface Props {
  info: LoyaltyInfo;
}

export default function LoyaltyBanner({ info }: Props) {
  const { theme, isDark } = useTheme();
  
  // Animation refs
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow/Pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[s.container, { backgroundColor: theme.colors.surface, marginBottom: 12 }]}>
      <View style={s.header}>
        <View style={s.tierInfo}>
          <Animated.View style={{ 
            transform: [
              { translateY: floatAnim },
              { scale: glowAnim }
            ],
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isDark ? 0.8 : 0.4,
            shadowRadius: 10,
          }}>
            <Text style={s.icon}>{info.icon}</Text>
          </Animated.View>
          <View style={{ marginLeft: 6 }}>
            <Text style={[s.tierTitle, { color: theme.colors.textPrimary }]}>
              {info.tier} {info.stamps > 0 && <Text style={{ color: theme.colors.primary }}> (x{info.stamps} 👑)</Text>}
            </Text>
            <Text style={[s.countText, { color: theme.colors.textSecondary }]}>
              {info.ordersNeededForNext > 0 
                ? `Faltam ${info.ordersNeededForNext} para o próximo nível`
                : 'Nível Máximo atingido!'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[s.progressBg, { backgroundColor: isDark ? '#333' : '#eee' }]}>
        <View style={[s.progressFill, { width: `${info.progress * 100}%`, backgroundColor: theme.colors.primary }]} />
      </View>
      
      <View style={s.footer}>
        <Text style={[s.footerText, { color: theme.colors.textSecondary }]}>{info.currentEloOrders} / 30 pedidos</Text>
        {info.stamps > 0 && <Text style={[s.footerText, { color: theme.colors.primary }]}>Selo Real Ativo</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});

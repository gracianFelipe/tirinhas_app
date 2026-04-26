import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { theme } from '../constants/theme';

interface Props {
  visible: boolean;
  source: any; // Can be a local require or a URL object
  title: string;
  subtitle?: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function LottieModal({ 
  visible, 
  source, 
  title, 
  subtitle, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={s.overlay}>
        <Animated.View style={[s.content, { opacity: fadeAnim }]}>
          <LottieView
            source={source}
            autoPlay
            loop={!autoClose}
            style={s.lottie}
          />
          <Text style={s.title}>{title}</Text>
          {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          
          {!autoClose && (
            <TouchableOpacity style={s.button} onPress={handleClose}>
              <Text style={s.buttonText}>OK</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

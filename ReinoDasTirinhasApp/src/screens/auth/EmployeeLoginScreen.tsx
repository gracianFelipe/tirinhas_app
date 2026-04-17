import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { theme } from '../../constants/theme';

export default function EmployeeLoginScreen({ navigation }: any) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (login === 'Felipe' && password === '1234?') {
      navigation.replace('Dashboard');
    } else {
      Alert.alert('Erro', 'Credenciais inválidas');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área do Funcionário</Text>
      
      <View style={styles.card}>
        <TextInput 
          style={styles.input} 
          placeholder="Login" 
          value={login}
          onChangeText={setLogin}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Senha" 
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={theme.colors.textSecondary}
        />
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Acessar Painel</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Usa o mesmo fundo claro elegante
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: 24,
    color: theme.colors.accent,
    fontWeight: '800',
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: 16,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    height: 50,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    color: theme.colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  backButton: {
    marginTop: theme.spacing.l,
    alignItems: 'center',
  },
  backText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  }
});

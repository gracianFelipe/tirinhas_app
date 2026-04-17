import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { theme } from '../../constants/theme';

export default function LoginScreen({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleEntrar = () => {
    if (nome === 'Felipe' && telefone === '1234?') {
      // Atalho secreto se digitar Felipe na área do cliente
      navigation.replace('Dashboard');
    } else if (nome.trim() !== '') {
      // Cliente preencheu o nome
      navigation.navigate('Menu');
    } else {
      Alert.alert('Realeza', 'Preencha pelo menos seu nome para entrar, ou clique abaixo em "Pular" para ver o cardápio direto.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Reino</Text>
      
      <View style={styles.card}>
        <TextInput 
          style={styles.input} 
          placeholder="Seu nome" 
          placeholderTextColor={theme.colors.textSecondary}
          value={nome}
          onChangeText={setNome}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Seu telefone" 
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.textSecondary}
          value={telefone}
          onChangeText={setTelefone}
        />
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleEntrar}>
          <Text style={styles.primaryButtonText}>Entrar</Text>
        </TouchableOpacity>
      </View>

      {/* Opção para Pular (Skip to Menu) */}
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={() => navigation.navigate('Menu')}
      >
        <Text style={styles.skipText}>Ver o Cardápio (Pular Login)</Text>
      </TouchableOpacity>

      {/* Rota escondida para funcionários */}
      <TouchableOpacity 
        style={styles.employeeArea}
        onPress={() => navigation.navigate('EmployeeLogin')}
      >
        <Text style={styles.employeeText}>Acesso Restrito</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    color: theme.colors.textPrimary,
    fontWeight: '800',
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: 16,
    shadowColor: theme.colors.primary,
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
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  skipButton: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  skipText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  employeeArea: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  employeeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  }
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme } from '../../constants/theme';
import * as SQLite from 'expo-sqlite';

export default function LoginScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const executeAuth = async () => {
    if (!login || !password) {
      Alert.alert('Atenção', 'Preencha o Login e a Senha para prosseguir.');
      return;
    }

    try {
      const db = await SQLite.openDatabaseAsync('reino_das_tirinhas.db');
      
      if (isLogin) {
        // Fluxo de Login
        const result: any = await db.getFirstAsync('SELECT * FROM User WHERE login = ? AND password = ?', [login, password]);
        if (result) {
          if (result.role === 'employee') {
            navigation.replace('Dashboard', { user: result });
          } else {
            navigation.replace('Menu', { user: result });
          }
        } else {
          Alert.alert('Acesso Negado', 'Credenciais inválidas. Verifique seu login e senha.');
        }
      } else {
        // Fluxo de Cadastro
        if (!name) {
          Alert.alert('Atenção', 'Rainhas e Reis precisam de nome. Preencha o seu nome!');
          return;
        }
        
        // Impede logins repetidos
        const exists: any = await db.getFirstAsync('SELECT id FROM User WHERE login = ?', [login]);
        if (exists) {
          Alert.alert('Ops', 'Nome de usuário indisponível. Escolha outro Login.');
          return;
        }

        const insert = await db.runAsync(
          'INSERT INTO User (login, password, role, name, phone) VALUES (?, ?, ?, ?, ?)',
          [login, password, 'client', name, phone]
        );

        const newUser = { id: insert.lastInsertRowId, login, role: 'client', name, phone };
        Alert.alert('Bem-vindo à Realeza!', 'Conta de cliente criada com sucesso!', [
          { text: 'Acessar o Cardápio', onPress: () => navigation.replace('Menu', { user: newUser }) }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Houve um problema de conexão com a Base de Dados local.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reino das Tirinhas</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, isLogin && styles.activeTab]} onPress={() => setIsLogin(true)}>
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>ENTRAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, !isLogin && styles.activeTab]} onPress={() => setIsLogin(false)}>
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>CRIAR CONTA</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {!isLogin && (
            <>
              <TextInput 
                style={styles.input} 
                placeholder="Seu Nome Completo" 
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
              <TextInput 
                style={styles.input} 
                placeholder="Seu Telefone (Opcional)" 
                keyboardType="phone-pad"
                placeholderTextColor={theme.colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
              />
            </>
          )}

          <TextInput 
            style={styles.input} 
            placeholder="Nome de Usuário (Login)" 
            autoCapitalize="none"
            placeholderTextColor={theme.colors.textSecondary}
            value={login}
            onChangeText={setLogin}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Sua Senha" 
            secureTextEntry
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={executeAuth}>
            <Text style={styles.primaryButtonText}>{isLogin ? 'Acessar o Salão' : 'Registrar no Reino'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl, paddingBottom: 100 },
  title: { fontSize: 32, color: theme.colors.textPrimary, fontWeight: '900', marginBottom: 40, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#EADFC8', borderRadius: 8, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { backgroundColor: theme.colors.primary },
  tabText: { fontWeight: 'bold', color: theme.colors.textSecondary },
  activeTabText: { color: '#FFF' },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.l, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  input: { height: 50, backgroundColor: theme.colors.background, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EFEFEF', color: theme.colors.textPrimary },
  primaryButton: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

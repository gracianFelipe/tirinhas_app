import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { RootStackParamList, User, UserRole } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

interface ProfileRow {
  id: string;
  name: string;
  phone: string | null;
  role: UserRole;
}

export default function LoginScreen({ navigation }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const goAfterAuth = async (authUserId: string, authEmail: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, phone, role')
      .eq('id', authUserId)
      .single<ProfileRow>();

    if (error || !profile) {
      console.error(error);
      Alert.alert('Ops', 'Não foi possível carregar seu perfil. Tente novamente.');
      return;
    }

    const user: User = {
      id: profile.id,
      email: authEmail,
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

  const executeAuth = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha para prosseguir.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
          Alert.alert('Acesso Negado', error?.message ?? 'Credenciais inválidas.');
          return;
        }
        await goAfterAuth(data.user.id, data.user.email ?? email);
      } else {
        if (!name) {
          Alert.alert('Atenção', 'Rainhas e Reis precisam de nome. Preencha o seu nome!');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, phone, role: 'client' },
          },
        });
        if (error) {
          Alert.alert('Erro no cadastro', error.message);
          return;
        }
        if (!data.session || !data.user) {
          Alert.alert(
            'Quase lá!',
            'Conta criada. Confirme seu e-mail (ou desative a confirmação no painel do Supabase) e faça login.'
          );
          setIsLogin(true);
          return;
        }
        await goAfterAuth(data.user.id, data.user.email ?? email);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Houve um problema de conexão. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTab = (value: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLogin(value);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Reino das Tirinhas</Text>
  
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, isLogin && styles.activeTab]} onPress={() => toggleTab(true)}>
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>ENTRAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, !isLogin && styles.activeTab]} onPress={() => toggleTab(false)}>
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
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                blurOnSubmit={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Seu Telefone (Opcional)"
                keyboardType="phone-pad"
                placeholderTextColor={theme.colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                returnKeyType="next"
                onSubmitEditing={() => loginRef.current?.focus()}
                blurOnSubmit={false}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Sua Senha"
            secureTextEntry
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={executeAuth}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={executeAuth}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Aguarde...' : isLogin ? 'Acessar o Salão' : 'Registrar no Reino'}
            </Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
  primaryButtonDisabled: { backgroundColor: '#CCC' },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

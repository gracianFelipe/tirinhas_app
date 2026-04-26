import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { resolveProductImage } from '../../utils/productImages';
import { Product, RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;
type Tab = 'tirinhas' | 'barcas' | 'acompanhamentos' | 'bebidas';

const TABS: { key: Tab; label: string }[] = [
  { key: 'tirinhas', label: '🍗 Tirinhas' },
  { key: 'barcas', label: '🚢 Barcas' },
  { key: 'acompanhamentos', label: '🍟 Extras' },
  { key: 'bebidas', label: '🥤 Bebidas' },
];

const DRINK_GROUPS = [
  { label: 'Latas', match: (n: string) => n.toLowerCase().includes('lata') },
  { label: 'Garrafinhas 500ml', match: (n: string) => n.includes('500ml') },
  { label: 'Refri 1L', match: (n: string) => n.includes('1L') },
  { label: 'Refri 2L', match: (n: string) => n.includes('2L') },
  { label: 'Sodas Italianas', match: (n: string) => n.toLowerCase().includes('soda') },
];

export default function MenuScreen({ route, navigation }: Props) {
  const user = route.params?.user;
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('tirinhas');

  useEffect(() => {
    supabase.from('products').select('id, name, description, price, category, image')
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setProducts(data as Product[]);
      });
  }, []);

  const byCategory = (cat: string) => products.filter(p => p.category === cat);

  const handlePress = (item: Product) => {
    if (!user) {
      Alert.alert('Conta Necessária', 'Faça login para pedir!',
        [{ text: 'Login', onPress: () => navigation.replace('Splash') }]);
      return;
    }
    if (item.category === 'Tirinha') navigation.navigate('OrderBuilder', { product: item, user });
    else if (item.category === 'Acompanhamento') navigation.navigate('AcompanhamentoOrder', { product: item, user });
    else if (item.category === 'Barca') navigation.navigate('BarcaOrder', { product: item, user });
    else if (item.category === 'Bebida') navigation.navigate('BebidaOrder', { product: item, user });
  };

  const renderCard = (item: Product) => {
    const clickable = ['Tirinha', 'Acompanhamento', 'Barca', 'Bebida'].includes(item.category);
    return (
      <TouchableOpacity style={s.card} activeOpacity={clickable ? 0.7 : 1} onPress={() => clickable && handlePress(item)}>
        <Image source={resolveProductImage(item.image)} style={s.cardImage} />
        <View style={s.cardInfo}>
          <Text style={s.cardTitle}>{item.name}</Text>
          <Text style={s.cardDesc}>{item.description}</Text>
          {item.price > 0 && <Text style={s.cardPrice}>R$ {item.price.toFixed(2)}</Text>}
          {clickable && <Text style={s.cardAction}>+ PEDIR</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'tirinhas') {
      const tirinhas = byCategory('Tirinha');
      const molhos = byCategory('Molho');
      return (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={s.sectionHeader}>Tirinhas Crocantes (2 molhos inclusos)</Text>
          {tirinhas.map(p => <View key={p.id}>{renderCard(p)}</View>)}
          <Text style={s.sectionHeader}>Molhos Premium</Text>
          {molhos.map(p => <View key={p.id}>{renderCard(p)}</View>)}
        </ScrollView>
      );
    }

    if (activeTab === 'barcas') {
      const barcas = byCategory('Barca');
      return (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={s.sectionHeader}>Combos Barca</Text>
          {barcas.map(p => <View key={p.id}>{renderCard(p)}</View>)}
        </ScrollView>
      );
    }

    if (activeTab === 'acompanhamentos') {
      const acomp = byCategory('Acompanhamento');
      return (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={s.sectionHeader}>Acompanhamentos</Text>
          {acomp.map(p => <View key={p.id}>{renderCard(p)}</View>)}
        </ScrollView>
      );
    }

    if (activeTab === 'bebidas') {
      const bebidas = byCategory('Bebida');
      return (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {DRINK_GROUPS.map(group => {
            const items = bebidas.filter(b => group.match(b.name));
            if (items.length === 0) return null;
            return (
              <View key={group.label}>
                <Text style={s.sectionHeader}>{group.label}</Text>
                {items.map(p => <View key={p.id}>{renderCard(p)}</View>)}
              </View>
            );
          })}
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.homeButton} onPress={async () => { await supabase.auth.signOut(); navigation.replace('Splash'); }}>
          <Feather name="log-out" size={24} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cardápio</Text>
        {user && (
          <TouchableOpacity style={s.ordersButton} onPress={() => navigation.navigate('MyOrders', { user })}>
            <Feather name="clipboard" size={22} color={theme.colors.primaryDark} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabItem, activeTab === tab.key && s.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={[s.tabItemText, activeTab === tab.key && s.tabItemTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>{renderTabContent()}</View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: theme.colors.surface, paddingTop: 48, paddingBottom: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderColor: '#EFEFEF' },
  homeButton: { position: 'absolute', left: 16, bottom: 14, padding: 6 },
  ordersButton: { position: 'absolute', right: 16, bottom: 14, padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  tabBar: { backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderColor: '#EFEFEF', flexGrow: 0 },
  tabBarContent: { paddingHorizontal: 4 },
  tabItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: theme.colors.primary },
  tabItemText: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary },
  tabItemTextActive: { color: theme.colors.primary },
  sectionHeader: { fontSize: 17, fontWeight: 'bold', color: theme.colors.primaryDark, marginVertical: 14, marginLeft: 16 },
  card: { flexDirection: 'row', backgroundColor: theme.colors.surface, marginHorizontal: 16, marginBottom: 10, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  cardImage: { width: 90, height: 90 },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 3 },
  cardDesc: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 6 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: theme.colors.primary },
  cardAction: { color: theme.colors.primary, marginTop: 6, fontSize: 12, fontWeight: 'bold' },
});

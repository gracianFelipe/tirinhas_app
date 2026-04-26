import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { resolveProductImage } from '../../utils/productImages';
import { Product, RootStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import LoyaltyBanner from '../../components/LoyaltyBanner';
import { getLoyaltyInfo, LoyaltyInfo } from '../../utils/loyalty';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;
type Tab = 'tirinhas' | 'barcas' | 'acompanhamentos' | 'bebidas';

const TABS: { key: Tab; label: string }[] = [
  { key: 'tirinhas', label: '🍗 Tirinhas' },
  { key: 'barcas', label: '🚢 Barcas' },
  { key: 'acompanhamentos', label: '🍟 Extras' },
  { key: 'bebidas', label: '🥤 Bebidas' },
];

const DRINK_GROUPS = [
  { label: '🥤 Latas', match: (n: string) => n.toLowerCase().includes('lata') && !n.toLowerCase().includes('soda') },
  { label: '🍼 500ml', match: (n: string) => 
      (n.toLowerCase().includes('500ml') || n.toLowerCase().includes('500 ml')) || 
      n.toLowerCase().includes('h2o') || 
      n.toLowerCase().includes('limoneto') 
  },
  { label: '🧊 Refri 1l', match: (n: string) => n.toLowerCase().includes('1l') },
  { label: '🌊 Refri 2L', match: (n: string) => n.toLowerCase().includes('2l') },
  { label: '✨ Especiais', match: (n: string) => n.toLowerCase().includes('soda') },
];

function AccordionSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <View style={{ marginBottom: 4 }}>
      <TouchableOpacity
        style={[s.accordionHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.background }]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={[s.sectionHeader, { color: theme.colors.primaryDark }]}>{title}</Text>
        <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.primaryDark} />
      </TouchableOpacity>
      {isOpen && <View style={{ paddingBottom: 10 }}>{children}</View>}
    </View>
  );
}

export default function MenuScreen({ route, navigation }: Props) {
  const { theme, isDark, toggleTheme } = useTheme();
  const user = route.params?.user;
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('tirinhas');
  const [loyalty, setLoyalty] = useState<LoyaltyInfo | null>(null);

  useEffect(() => {
    supabase.from('products').select('id, name, description, price, category, image')
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setProducts(data as Product[]);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchLoyalty = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'Entregue');
      setLoyalty(getLoyaltyInfo(count || 0));
    };
    fetchLoyalty();
  }, [user]);

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
      <TouchableOpacity 
        style={[s.card, { backgroundColor: theme.colors.surface }]} 
        activeOpacity={clickable ? 0.7 : 1} 
        onPress={() => clickable && handlePress(item)}
      >
        <Image source={resolveProductImage(item.image)} style={s.cardImage} />
        <View style={s.cardInfo}>
          <Text style={[s.cardTitle, { color: theme.colors.textPrimary }]}>{item.name}</Text>
          <Text style={[s.cardDesc, { color: theme.colors.textSecondary }]}>{item.description}</Text>
          {item.price > 0 && <Text style={[s.cardPrice, { color: theme.colors.primary }]}>R$ {item.price.toFixed(2)}</Text>}
          {clickable && <Text style={[s.cardAction, { color: theme.colors.primary }]}>+ PEDIR</Text>}
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
          <AccordionSection title="🍗 Tirinhas Crocantes" defaultOpen>
            {tirinhas.map(p => <View key={p.id}>{renderCard(p)}</View>)}
          </AccordionSection>
          <AccordionSection title="🍯 Molhos Premium">
            {molhos.map(p => <View key={p.id}>{renderCard(p)}</View>)}
          </AccordionSection>
        </ScrollView>
      );
    }

    if (activeTab === 'barcas') {
      const barcas = byCategory('Barca');
      return (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <AccordionSection title="🚢 Combos Barca" defaultOpen>
            {barcas.map(p => <View key={p.id}>{renderCard(p)}</View>)}
          </AccordionSection>
        </ScrollView>
      );
    }

    if (activeTab === 'acompanhamentos') {
      const acomp = byCategory('Acompanhamento');
      const batatas   = acomp.filter(p => p.name.toLowerCase().includes('frit') && !p.name.toLowerCase().includes('crocant') && !p.name.toLowerCase().includes('supremo'));
      const supremo   = acomp.filter(p => p.name.toLowerCase().includes('supremo'));
      const crocant   = acomp.filter(p => p.name.toLowerCase().includes('crocant'));
      return (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <AccordionSection title="🍟 Batatas Fritas" defaultOpen>
            {batatas.map(p => <View key={p.id}>{renderCard(p)}</View>)}
          </AccordionSection>
          <AccordionSection title="🥇 Supremo de Batata">
            {supremo.map(p => <View key={p.id}>{renderCard(p)}</View>)}
          </AccordionSection>
          <AccordionSection title="🍿 Crocantonas">
            {crocant.map(p => <View key={p.id}>{renderCard(p)}</View>)}
          </AccordionSection>
        </ScrollView>
      );
    }

    if (activeTab === 'bebidas') {
      const bebidas = byCategory('Bebida');
      return (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {DRINK_GROUPS.map((group, idx) => {
            const items = bebidas.filter(b => group.match(b.name));
            if (items.length === 0) return null;
            return (
              <AccordionSection key={group.label} title={group.label} defaultOpen={idx === 0}>
                {items.map(p => <View key={p.id}>{renderCard(p)}</View>)}
              </AccordionSection>
            );
          })}
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <View style={[s.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.colors.surface, borderColor: isDark ? '#333' : '#EFEFEF' }]}>
        <TouchableOpacity style={s.homeButton} onPress={async () => { await supabase.auth.signOut(); navigation.replace('Splash'); }}>
          <Feather name="log-out" size={24} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Cardápio</Text>
        
        <View style={s.headerRight}>
          <TouchableOpacity style={s.themeToggle} onPress={toggleTheme}>
            <Feather name={isDark ? "sun" : "moon"} size={22} color={theme.colors.primaryDark} />
          </TouchableOpacity>
          {user && (
            <TouchableOpacity style={s.ordersButton} onPress={() => navigation.navigate('MyOrders', { user })}>
              <Feather name="clipboard" size={22} color={theme.colors.primaryDark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {user && loyalty && <LoyaltyBanner info={loyalty} />}

      {/* Tab bar */}
      <View style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderColor: isDark ? '#333' : '#EFEFEF' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabItem, activeTab === tab.key && { borderBottomColor: theme.colors.primary }]}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={[s.tabItemText, { color: theme.colors.textSecondary }, activeTab === tab.key && { color: theme.colors.primary }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>{renderTabContent()}</View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 48, paddingBottom: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, flexDirection: 'row' },
  homeButton: { position: 'absolute', left: 16, bottom: 14, padding: 6 },
  headerRight: { position: 'absolute', right: 16, bottom: 14, flexDirection: 'row', alignItems: 'center' },
  themeToggle: { padding: 6, marginRight: 8 },
  ordersButton: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  tabBar: { flexGrow: 0 },
  tabBarContent: { paddingHorizontal: 4 },
  tabItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabItemText: { fontSize: 13, fontWeight: '700' },
  sectionHeader: { fontSize: 17, fontWeight: 'bold' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, marginTop: 10, borderBottomWidth: 1 },
  card: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  cardImage: { width: 90, height: 90 },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  cardDesc: { fontSize: 11, marginBottom: 6 },
  cardPrice: { fontSize: 14, fontWeight: '800' },
  cardAction: { marginTop: 6, fontSize: 12, fontWeight: 'bold' },
});

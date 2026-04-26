import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { resolveProductImage } from '../../utils/productImages';
import { Product, RootStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import LottieModal from '../../components/LottieModal';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderBuilder'>;

const DEFAULT_FREE_SAUCES = 2;
const SUCCESS_LOTTIE = { uri: 'https://lottie.host/74f1778c-0f9c-4654-8e11-e737119e8834/A9Wd0R4V2E.json' };

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

const ACOMP_GROUPS = [
  { label: '🍟 Batatas Fritas', match: (n: string) => n.toLowerCase().includes('frit') && !n.toLowerCase().includes('crocant') && !n.toLowerCase().includes('supremo') },
  { label: '🥇 Supremo de Batata', match: (n: string) => n.toLowerCase().includes('supremo') },
  { label: '🍿 Crocantonas', match: (n: string) => n.toLowerCase().includes('crocant') },
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

export default function OrderBuilderScreen({ route, navigation }: Props) {
  const { theme, isDark } = useTheme();
  const { product, user } = route.params;

  const [sauces, setSauces] = useState<Product[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<number[]>([]);
  const [acompanhamentos, setAcompanhamentos] = useState<Product[]>([]);
  const [selectedAcomp, setSelectedAcomp] = useState<number[]>([]);
  const [bebidas, setBebidas] = useState<Product[]>([]);
  const [selectedBebidas, setSelectedBebidas] = useState<number[]>([]);
  const [showBebidas, setShowBebidas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasPendingReward, setHasPendingReward] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState('');

  const freeSaucesLimit = hasPendingReward ? DEFAULT_FREE_SAUCES + 1 : DEFAULT_FREE_SAUCES;

  useEffect(() => {
    const fetchUserReward = async () => {
      const { data } = await supabase.from('profiles').select('has_pending_reward').eq('id', user.id).single();
      if (data?.has_pending_reward) setHasPendingReward(true);
    };

    const fetchExtras = async () => {
      const { data } = await supabase.from('products').select('id, name, description, price, category, image')
        .in('category', ['Molho', 'Acompanhamento', 'Bebida']).order('id', { ascending: true });
      if (data) {
        const productsList = data as Product[];
        setSauces(productsList.filter(p => p.category === 'Molho'));
        setAcompanhamentos(productsList.filter(p => p.category === 'Acompanhamento'));
        setBebidas(productsList.filter(p => p.category === 'Bebida'));
      }
    };
    
    fetchUserReward();
    fetchExtras();
  }, [user.id]);

  const toggleSauce = (id: number) => setSelectedSauces(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  const toggleAcomp = (id: number) => setSelectedAcomp(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  const toggleBebida = (id: number) => setSelectedBebidas(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const extraSauceCost = selectedSauces.slice(freeSaucesLimit).reduce((sum, id) => sum + (sauces.find(s => s.id === id)?.price ?? 3.5), 0);
  const finalAcompCost = selectedAcomp.reduce((sum, id) => {
    const a = acompanhamentos.find(a => a.id === id);
    if (hasPendingReward && a?.name.toLowerCase().includes('fritas p')) return sum;
    return sum + (a?.price ?? 0);
  }, 0);
  const bebidaCost = selectedBebidas.reduce((sum, id) => sum + (bebidas.find(b => b.id === id)?.price ?? 0), 0);

  const subtotal = product.price + extraSauceCost + finalAcompCost + bebidaCost;
  const isComboReal = product.category === 'Tirinha' && selectedAcomp.some(id => acompanhamentos.find(i => i.id === id)?.name.toLowerCase().includes('frit')) && selectedBebidas.length > 0;
  const discount = isComboReal ? subtotal * 0.1 : 0;
  const totalPrice = subtotal - discount;

  const handleCheckout = async () => {
    if (selectedSauces.length < 1) { Alert.alert('Atenção', 'Escolha pelo menos 1 molho.'); return; }
    setSubmitting(true);
    try {
      const orderNumber = 'RT-' + Math.floor(Math.random() * 10000);
      const { data: orderRow, error: orderError } = await supabase.from('orders').insert({
          user_id: user.id, order_number: orderNumber, status: 'Recebido na Cozinha', total_amount: totalPrice,
      }).select('id').single<{ id: number }>();
      if (orderError || !orderRow) throw orderError;
      if (hasPendingReward) await supabase.from('profiles').update({ has_pending_reward: false }).eq('id', user.id);

      const sauceItems = selectedSauces.map((id, i) => ({
        order_id: orderRow.id, product_id: id, quantity: 1, unit_price: i < freeSaucesLimit ? 0 : (sauces.find(s => s.id === id)?.price ?? 3.5),
      }));
      const acompItems = selectedAcomp.map(id => {
        const a = acompanhamentos.find(item => item.id === id);
        return { order_id: orderRow.id, product_id: id, quantity: 1, unit_price: (hasPendingReward && a?.name.toLowerCase().includes('fritas p')) ? 0 : (a?.price ?? 0) };
      });
      const bebidaItems = selectedBebidas.map(id => ({ order_id: orderRow.id, product_id: id, quantity: 1, unit_price: bebidas.find(b => b.id === id)?.price ?? 0 }));

      await supabase.from('order_items').insert([{ order_id: orderRow.id, product_id: product.id, quantity: 1, unit_price: product.price }, ...sauceItems, ...acompItems, ...bebidaItems]);
      setOrderNum(orderNumber);
      setShowSuccess(true);
    } catch (e) { Alert.alert('Erro', 'Tente novamente.'); } finally { setSubmitting(false); }
  };

  const renderCard = (item: Product, type: 'sauce' | 'acomp' | 'bebida') => {
    const isSelected = type === 'sauce' ? selectedSauces.includes(item.id) : type === 'acomp' ? selectedAcomp.includes(item.id) : selectedBebidas.includes(item.id);
    const isPaidSauce = type === 'sauce' && isSelected && selectedSauces.indexOf(item.id) >= freeSaucesLimit;
    const isFreePotato = type === 'acomp' && hasPendingReward && item.name.toLowerCase().includes('fritas p');

    return (
      <TouchableOpacity 
        key={item.id} 
        style={[s.itemCard, { backgroundColor: theme.colors.surface }, isSelected && s.itemCardSel, isPaidSauce && s.itemCardExtra]} 
        onPress={() => type === 'sauce' ? toggleSauce(item.id) : type === 'acomp' ? toggleAcomp(item.id) : toggleBebida(item.id)}
      >
        <Image source={resolveProductImage(item.image)} style={s.itemImage} />
        <View style={{ flex: 1 }}>
          <Text style={[s.itemName, { color: theme.colors.textPrimary }, isSelected && s.textSel]}>{item.name}</Text>
          {isPaidSauce && <Text style={s.extraBadge}>+ R$ {item.price.toFixed(2)}</Text>}
          {type === 'sauce' && isSelected && !isPaidSauce && <Text style={s.freeBadge}>✓ Incluso</Text>}
          {type !== 'sauce' && (isFreePotato ? <Text style={s.freeBadge}>✓ GRÁTIS (Prêmio Real)</Text> : <Text style={[s.itemPrice, { color: theme.colors.primary }]}>R$ {item.price.toFixed(2)}</Text>)}
        </View>
        <View style={[s.radio, isSelected && s.radioSel]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}><Text style={[s.backButtonText, { color: theme.colors.primaryDark }]}>← Voltar</Text></TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Montar Combinação</Text>

        {hasPendingReward && (
          <View style={s.rewardBanner}>
            <Feather name="award" size={20} color="#fff" />
            <Text style={s.rewardText}>Prêmio Real: +1 Molho e Batata P Grátis!</Text>
          </View>
        )}

        <View style={[s.mainProduct, { backgroundColor: theme.colors.surface }]}>
          <Image source={resolveProductImage(product.image)} style={s.productImage} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[s.productName, { color: theme.colors.textPrimary }]}>{product.name}</Text>
            <Text style={[s.productPrice, { color: theme.colors.primary }]}>R$ {product.price.toFixed(2)}</Text>
            <Text style={[s.productDesc, { color: theme.colors.textSecondary }]}>{product.description}</Text>
          </View>
        </View>

        {selectedBebidas.length === 0 && bebidas.length > 0 && (
          <TouchableOpacity style={s.suggestionBanner} onPress={() => { setShowBebidas(true); toggleBebida((bebidas.find(b => b.name.toLowerCase().includes('soda maracujá')) || bebidas[0]).id); }}>
            <View style={s.suggestionContent}>
              <View style={s.suggestionIconBox}><Feather name="star" size={18} color="#FFF" /></View>
              <View style={{ flex: 1 }}><Text style={s.suggestionTitle}>Dica do Chef 👨‍🍳</Text><Text style={s.suggestionText}>Uma Soda Italiana geladinha combina muito com Tirinhas!</Text></View>
              <Text style={s.suggestionAdd}>+ ADD</Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={[s.sectionTitle, { color: theme.colors.textPrimary }]}>Molhos:</Text>
        <Text style={[s.counter, { color: theme.colors.primary }]}>{selectedSauces.length} selecionado(s) {selectedSauces.length > freeSaucesLimit ? `(${selectedSauces.length - freeSaucesLimit} extra)` : `(${freeSaucesLimit - selectedSauces.length} grátis)`}</Text>
        <View style={s.list}>{sauces.map(s => renderCard(s, 'sauce'))}</View>

        <Text style={[s.sectionTitle, { color: theme.colors.textPrimary }]}>Acompanhamentos (Opcional):</Text>
        <View style={s.list}>
          {ACOMP_GROUPS.map((group, idx) => {
            const items = acompanhamentos.filter(a => group.match(a.name));
            if (items.length === 0) return null;
            return (
              <AccordionSection key={group.label} title={group.label} defaultOpen={idx === 0}>
                {items.map(p => renderCard(p, 'acomp'))}
              </AccordionSection>
            );
          })}
        </View>

        <TouchableOpacity style={[s.drinksToggle, { backgroundColor: theme.colors.accent }]} onPress={() => setShowBebidas(!showBebidas)}><Text style={s.drinksToggleText}>🥤 {showBebidas ? 'Ocultar Bebidas' : 'Adicionar Bebida?'}</Text></TouchableOpacity>
        {showBebidas && (
          <View style={s.list}>
            {DRINK_GROUPS.map((group, idx) => {
              const items = bebidas.filter(b => group.match(b.name));
              if (items.length === 0) return null;
              return (
                <AccordionSection key={group.label} title={group.label} defaultOpen={idx === 0}>
                  {items.map(p => renderCard(p, 'bebida'))}
                </AccordionSection>
              );
            })}
          </View>
        )}

        <View style={[s.checkoutBox, { backgroundColor: theme.colors.surface }]}>
          {isComboReal && <View style={s.comboBadge}><Feather name="trending-down" size={16} color="#27ae60" /><Text style={s.comboBadgeText}>Combo Real: - R$ {discount.toFixed(2)} (10%)</Text></View>}
          <View style={s.totalRow}><View><Text style={[s.totalLabel, { color: theme.colors.textPrimary }]}>Total:</Text>{isComboReal && <Text style={s.subtotalText}>R$ {subtotal.toFixed(2)}</Text>}</View><Text style={[s.totalValue, { color: theme.colors.primary }]}>R$ {totalPrice.toFixed(2)}</Text></View>
          <TouchableOpacity style={[s.confirmButton, { backgroundColor: theme.colors.primary }, (selectedSauces.length < 1 || submitting) && s.disabledButton]} onPress={handleCheckout} disabled={submitting || selectedSauces.length < 1}><Text style={s.confirmText}>{submitting ? 'Enviando...' : 'Confirmar Pedido'}</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <LottieModal visible={showSuccess} source={SUCCESS_LOTTIE} title="Pedido Enviado!" subtitle={`Ordem ${orderNum} já está na nossa forja, ${user.name}!`} onClose={() => navigation.reset({ index: 0, routes: [{ name: 'Menu', params: { user } }] })} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 120 },
  backButton: { marginTop: 30, marginBottom: 10 },
  backButtonText: { fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 26, fontWeight: '800', marginBottom: 16 },
  mainProduct: { flexDirection: 'row', padding: 12, borderRadius: 12, alignItems: 'center', elevation: 2, marginBottom: 20 },
  productImage: { width: 80, height: 80, marginRight: 12 },
  productName: { fontSize: 17, fontWeight: 'bold' },
  productPrice: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  productDesc: { fontSize: 12, marginTop: 4 },
  suggestionBanner: { backgroundColor: '#F0B955', borderRadius: 12, padding: 12, marginBottom: 20, elevation: 3 },
  suggestionContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestionIconBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 10 },
  suggestionTitle: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  suggestionText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  suggestionAdd: { backgroundColor: '#FFF', color: '#F0B955', fontWeight: '900', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, fontSize: 11 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  counter: { fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  list: { marginBottom: 12 },
  rewardBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E49C2C', padding: 12, borderRadius: 10, marginBottom: 16, gap: 10 },
  rewardText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, flex: 1 },
  comboBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 8, borderRadius: 6, marginBottom: 12, gap: 6 },
  comboBadgeText: { color: '#27ae60', fontWeight: 'bold', fontSize: 12 },
  subtotalText: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  itemCard: { flexDirection: 'row', padding: 10, borderRadius: 10, marginBottom: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  itemCardSel: { borderColor: '#E49C2C', backgroundColor: '#fdf7ee' },
  itemCardExtra: { borderColor: '#A62B22', backgroundColor: '#fff5f5' },
  itemImage: { width: 46, height: 46, marginRight: 10 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemPrice: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  textSel: { color: '#CD7522' },
  freeBadge: { fontSize: 11, color: '#27ae60', fontWeight: '700', marginTop: 2 },
  extraBadge: { fontSize: 11, color: '#A62B22', fontWeight: '700', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', marginLeft: 8 },
  radioSel: { borderColor: '#E49C2C', backgroundColor: '#E49C2C' },
  drinksToggle: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  drinksToggleText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  checkoutBox: { padding: 16, borderRadius: 12, elevation: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '900' },
  confirmButton: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  disabledButton: { backgroundColor: '#CCC' },
  confirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, marginTop: 8, borderBottomWidth: 1 },
});

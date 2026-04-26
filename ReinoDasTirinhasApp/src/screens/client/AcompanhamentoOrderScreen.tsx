import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { resolveProductImage } from '../../utils/productImages';
import { Product, RootStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import LottieModal from '../../components/LottieModal';

type Props = NativeStackScreenProps<RootStackParamList, 'AcompanhamentoOrder'>;

const SUCCESS_LOTTIE = { uri: 'https://lottie.host/74f1778c-0f9c-4654-8e11-e737119e8834/A9Wd0R4V2E.json' };

export default function AcompanhamentoOrderScreen({ route, navigation }: Props) {
  const { theme, isDark } = useTheme();
  const { product, user } = route.params;
  
  const [sauces, setSauces] = useState<Product[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<number[]>([]);
  const [bebidas, setBebidas] = useState<Product[]>([]);
  const [selectedBebidas, setSelectedBebidas] = useState<number[]>([]);
  const [showBebidas, setShowBebidas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState('');

  useEffect(() => {
    const fetchExtras = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, category, image')
        .in('category', ['Molho', 'Bebida'])
        .order('id', { ascending: true });
      if (data) {
        const productsList = data as Product[];
        setSauces(productsList.filter(p => p.category === 'Molho'));
        setBebidas(productsList.filter(p => p.category === 'Bebida'));
      }
    };
    fetchExtras();
  }, []);

  const toggleSauce = (id: number) =>
    setSelectedSauces(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const toggleBebida = (id: number) =>
    setSelectedBebidas(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const sauceCost = selectedSauces.reduce((sum, id) => {
    const s = sauces.find(item => item.id === id);
    return sum + (s?.price ?? 0);
  }, 0);

  const bebidaCost = selectedBebidas.reduce((sum, id) => {
    const b = bebidas.find(item => item.id === id);
    return sum + (b?.price ?? 0);
  }, 0);

  const subtotal = product.price + sauceCost + bebidaCost;
  
  // Sugestão: Se for batata e não tiver bebida, sugere uma Soda
  const showSuggestion = selectedBebidas.length === 0;
  const suggestedBebida = bebidas.find(b => b.name.toLowerCase().includes('soda maracujá')) || bebidas[0];

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      const orderNumber = 'RT-' + Math.floor(Math.random() * 10000);
      const { data: orderRow, error: orderError } = await supabase
        .from('orders').insert({
          user_id: user.id, order_number: orderNumber,
          status: 'Recebido na Cozinha', total_amount: subtotal,
        }).select('id').single<{ id: number }>();
      if (orderError || !orderRow) throw orderError;

      const sauceItems = selectedSauces.map(id => ({
        order_id: orderRow.id, product_id: id, quantity: 1,
        unit_price: sauces.find(s => s.id === id)?.price ?? 0,
      }));
      const bebidaItems = selectedBebidas.map(id => ({
        order_id: orderRow.id, product_id: id, quantity: 1,
        unit_price: bebidas.find(b => b.id === id)?.price ?? 0,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert([
        { order_id: orderRow.id, product_id: product.id, quantity: 1, unit_price: product.price },
        ...sauceItems, ...bebidaItems,
      ]);
      if (itemsError) throw itemsError;

      setOrderNum(orderNumber);
      setShowSuccess(true);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Houve um problema. Tente novamente.');
    } finally { setSubmitting(false); }
  };

  return (
    <View style={[s.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Text style={[s.backButtonText, { color: theme.colors.primaryDark }]}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>Acompanhamento</Text>

        {/* Product card */}
        <View style={[s.mainProduct, { backgroundColor: theme.colors.surface }]}>
          <Image source={resolveProductImage(product.image)} style={s.productImage} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[s.productName, { color: theme.colors.textPrimary }]}>{product.name}</Text>
            <Text style={[s.productPrice, { color: theme.colors.primary }]}>R$ {product.price.toFixed(2)}</Text>
            <Text style={[s.productDesc, { color: theme.colors.textSecondary }]}>{product.description}</Text>
          </View>
        </View>

        {/* Suggestion Banner */}
        {showSuggestion && suggestedBebida && (
          <TouchableOpacity 
            style={s.suggestionBanner} 
            onPress={() => {
              setShowBebidas(true);
              toggleBebida(suggestedBebida.id);
            }}
          >
            <View style={s.suggestionContent}>
              <View style={s.suggestionIconBox}>
                <Feather name="star" size={18} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.suggestionTitle}>Dica do Chef 👨‍🍳</Text>
                <Text style={s.suggestionText}>
                  A {suggestedBebida.name} fica perfeita com batata! Adicionar?
                </Text>
              </View>
              <Text style={s.suggestionAdd}>+ ADD</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Sauces */}
        <Text style={[s.sectionTitle, { color: theme.colors.textPrimary }]}>Molhos (opcional):</Text>
        <View style={s.list}>
          {sauces.map(sauce => {
            const sel = selectedSauces.includes(sauce.id);
            return (
              <TouchableOpacity 
                key={sauce.id} 
                style={[s.itemCard, { backgroundColor: theme.colors.surface }, sel && s.itemCardSel]} 
                onPress={() => toggleSauce(sauce.id)}
              >
                <Image source={resolveProductImage(sauce.image)} style={s.itemImage} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemName, { color: theme.colors.textPrimary }, sel && s.textSel]}>{sauce.name}</Text>
                  <Text style={[s.itemPrice, { color: theme.colors.primary }]}>R$ {sauce.price.toFixed(2)}</Text>
                </View>
                <View style={[s.radio, sel && s.radioSel]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Drinks toggle */}
        <TouchableOpacity style={[s.drinksToggle, { backgroundColor: theme.colors.accent }]} onPress={() => setShowBebidas(!showBebidas)}>
          <Text style={s.drinksToggleText}>🥤 {showBebidas ? 'Ocultar Bebidas' : 'Adicionar Bebida?'}</Text>
        </TouchableOpacity>

        {showBebidas && (
          <View style={s.list}>
            {bebidas.map(b => {
              const sel = selectedBebidas.includes(b.id);
              return (
                <TouchableOpacity 
                  key={b.id} 
                  style={[s.itemCard, { backgroundColor: theme.colors.surface }, sel && s.itemCardSel]} 
                  onPress={() => toggleBebida(b.id)}
                >
                  <Image source={resolveProductImage(b.image)} style={s.itemImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.itemName, { color: theme.colors.textPrimary }, sel && s.textSel]}>{b.name}</Text>
                    <Text style={[s.itemPrice, { color: theme.colors.primary }]}>R$ {b.price.toFixed(2)}</Text>
                  </View>
                  <View style={[s.radio, sel && s.radioSel]} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Checkout */}
        <View style={[s.checkoutBox, { backgroundColor: theme.colors.surface }]}>
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, { color: theme.colors.textPrimary }]}>Total:</Text>
            <Text style={[s.totalValue, { color: theme.colors.primary }]}>R$ {subtotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[s.confirmButton, { backgroundColor: theme.colors.primary }, submitting && s.disabledButton]}
            onPress={handleCheckout} disabled={submitting}>
            <Text style={s.confirmText}>{submitting ? 'Enviando...' : 'Confirmar Pedido'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LottieModal
        visible={showSuccess}
        source={SUCCESS_LOTTIE}
        title="Banquete Pronto!"
        subtitle={`Sua ordem ${orderNum} já está na forja!`}
        onClose={() => navigation.reset({ index: 0, routes: [{ name: 'Menu', params: { user } }] })}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
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
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  list: { marginBottom: 12 },
  itemCard: { flexDirection: 'row', padding: 10, borderRadius: 10, marginBottom: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  itemCardSel: { borderColor: '#E49C2C', backgroundColor: '#fdf7ee' },
  itemImage: { width: 46, height: 46, marginRight: 10 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemPrice: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  textSel: { color: '#CD7522' },
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
});

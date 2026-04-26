import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { resolveProductImage } from '../../utils/productImages';
import { Product, RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BarcaOrder'>;

// Barca de 7 inclui 4 molhos grátis; demais incluem 3
const getFreeMolhos = (name: string) => (name.includes('7') ? 4 : 3);

// Mapeia barca para tamanho de FritaTinha disponível
const getBarcaFritaSize = (name: string) => {
  if (name.includes('3')) return 'pequena';
  if (name.includes('5')) return 'média';
  return 'grande';
};

export default function BarcaOrderScreen({ route, navigation }: Props) {
  const { product, user } = route.params;
  const freeMolhos = getFreeMolhos(product.name);
  const fritaSize = getBarcaFritaSize(product.name);

  const [sauces, setSauces] = useState<Product[]>([]);
  const [acompanhamentos, setAcompanhamentos] = useState<Product[]>([]);
  const [bebidas, setBebidas] = useState<Product[]>([]);
  const [choice, setChoice] = useState<'azeitona' | 'batata' | null>(null);
  const [selectedMolhos, setSelectedMolhos] = useState<number[]>([]);
  const [selectedBebidas, setSelectedBebidas] = useState<number[]>([]);
  const [showBebidas, setShowBebidas] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, category, image')
        .in('category', ['Molho', 'Acompanhamento', 'Bebida'])
        .order('id', { ascending: true });
      if (data) {
        setSauces((data as Product[]).filter(p => p.category === 'Molho'));
        setAcompanhamentos((data as Product[]).filter(p => p.category === 'Acompanhamento'));
        setBebidas((data as Product[]).filter(p => p.category === 'Bebida'));
      }
    };
    fetch();
  }, []);

  // Filter acompanhamento products for the barca choice
  const crocantonas = acompanhamentos.find(a => a.name.toLowerCase().includes('crocant'));
  const fritaTinha = acompanhamentos.find(a =>
    a.name.toLowerCase().includes('fritatinha') && a.name.toLowerCase().includes(fritaSize)
  ) ?? acompanhamentos.find(a => a.name.toLowerCase().includes('fritatinha'));

  const choiceProduct = choice === 'azeitona' ? crocantonas : choice === 'batata' ? fritaTinha : null;

  const getSauceExtraPrice = (id: number) => sauces.find(s => s.id === id)?.price ?? 3.50;

  const toggleMolho = (id: number) =>
    setSelectedMolhos(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const toggleBebida = (id: number) =>
    setSelectedBebidas(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const extraMolhoCost = selectedMolhos.slice(freeMolhos).reduce((sum, id) => sum + getSauceExtraPrice(id), 0);
  const bebidaCost = selectedBebidas.reduce((sum, id) => sum + (bebidas.find(b => b.id === id)?.price ?? 0), 0);
  const totalPrice = product.price + extraMolhoCost + bebidaCost;

  const handleCheckout = async () => {
    if (!choice) { Alert.alert('Atenção', 'Escolha entre Azeitonas Crocantes ou FritaTinhas.'); return; }
    if (selectedMolhos.length < 1) { Alert.alert('Atenção', 'Escolha pelo menos 1 molho.'); return; }

    setSubmitting(true);
    try {
      const orderNumber = 'RT-' + Math.floor(Math.random() * 10000);
      const { data: orderRow, error: oErr } = await supabase.from('orders').insert({
        user_id: user.id, order_number: orderNumber,
        status: 'Recebido na Cozinha', total_amount: totalPrice,
      }).select('id').single<{ id: number }>();
      if (oErr || !orderRow) throw oErr;

      const molhoItems = selectedMolhos.map((id, i) => ({
        order_id: orderRow.id, product_id: id, quantity: 1,
        unit_price: i < freeMolhos ? 0 : getSauceExtraPrice(id),
      }));
      const bebidaItems = selectedBebidas.map(id => ({
        order_id: orderRow.id, product_id: id, quantity: 1,
        unit_price: bebidas.find(b => b.id === id)?.price ?? 0,
      }));

      const items = [
        { order_id: orderRow.id, product_id: product.id, quantity: 1, unit_price: product.price },
        ...molhoItems, ...bebidaItems,
      ];
      if (choiceProduct) {
        items.push({ order_id: orderRow.id, product_id: choiceProduct.id, quantity: 1, unit_price: 0 });
      }

      const { error: iErr } = await supabase.from('order_items').insert(items);
      if (iErr) throw iErr;

      Alert.alert('Barca Encomendada!', `Ordem ${orderNumber} chegou à cozinha, ${user.name}!`,
        [{ text: 'Voltar ao Cardápio', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Menu', params: { user } }] }) }]);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Houve um problema. Tente novamente.');
    } finally { setSubmitting(false); }
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Text style={s.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{product.name}</Text>

        <View style={s.mainProduct}>
          <Image source={resolveProductImage(product.image)} style={s.productImage} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={s.productName}>{product.name}</Text>
            <Text style={s.productPrice}>R$ {product.price.toFixed(2)}</Text>
            <Text style={s.productDesc}>{product.description}</Text>
          </View>
        </View>

        {/* Escolha: Azeitona ou Batata */}
        <Text style={s.sectionTitle}>Escolha seu Acompanhamento:</Text>
        <Text style={s.sectionSub}>Incluso na barca</Text>
        <View style={s.choiceRow}>
          <TouchableOpacity
            style={[s.choiceBtn, choice === 'azeitona' && s.choiceBtnActive]}
            onPress={() => setChoice('azeitona')}>
            <Text style={[s.choiceBtnText, choice === 'azeitona' && s.choiceBtnTextActive]}>🫒 Azeitonas{'\n'}Crocantes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.choiceBtn, choice === 'batata' && s.choiceBtnActive]}
            onPress={() => setChoice('batata')}>
            <Text style={[s.choiceBtnText, choice === 'batata' && s.choiceBtnTextActive]}>🍟 FritaTinhas</Text>
          </TouchableOpacity>
        </View>

        {/* Molhos */}
        <Text style={s.sectionTitle}>Molhos ({freeMolhos} inclusos):</Text>
        <Text style={s.counter}>
          {selectedMolhos.length} selecionado{selectedMolhos.length !== 1 ? 's' : ''}
          {selectedMolhos.length > freeMolhos
            ? ` · ${selectedMolhos.length - freeMolhos} extra${selectedMolhos.length - freeMolhos > 1 ? 's' : ''} cobrado${selectedMolhos.length - freeMolhos > 1 ? 's' : ''}`
            : ` · ${freeMolhos - selectedMolhos.length} grátis restante${freeMolhos - selectedMolhos.length !== 1 ? 's' : ''}`}
        </Text>
        <View style={s.list}>
          {sauces.map((sauce) => {
            const sel = selectedMolhos.includes(sauce.id);
            const pos = selectedMolhos.indexOf(sauce.id);
            const isPaid = sel && pos >= freeMolhos;
            return (
              <TouchableOpacity key={sauce.id}
                style={[s.itemCard, sel && s.itemCardSel, isPaid && s.itemCardExtra]}
                onPress={() => toggleMolho(sauce.id)}>
                <Image source={resolveProductImage(sauce.image)} style={s.itemImage} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemName, sel && s.textSel]}>{sauce.name}</Text>
                  {isPaid && <Text style={s.extraBadge}>+ R$ {getSauceExtraPrice(sauce.id).toFixed(2)}</Text>}
                  {sel && !isPaid && <Text style={s.freeBadge}>✓ Incluso</Text>}
                </View>
                <View style={[s.radio, sel && s.radioSel]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bebidas */}
        <TouchableOpacity style={s.drinksToggle} onPress={() => setShowBebidas(!showBebidas)}>
          <Text style={s.drinksToggleText}>🥤 {showBebidas ? 'Ocultar Bebidas' : 'Adicionar Bebida?'}</Text>
        </TouchableOpacity>
        {showBebidas && (
          <View style={s.list}>
            {bebidas.map(b => {
              const sel = selectedBebidas.includes(b.id);
              return (
                <TouchableOpacity key={b.id} style={[s.itemCard, sel && s.itemCardSel]} onPress={() => toggleBebida(b.id)}>
                  <Image source={resolveProductImage(b.image)} style={s.itemImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.itemName, sel && s.textSel]}>{b.name}</Text>
                    <Text style={s.itemPrice}>R$ {b.price.toFixed(2)}</Text>
                  </View>
                  <View style={[s.radio, sel && s.radioSel]} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={s.checkoutBox}>
          {extraMolhoCost > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>Molhos extras</Text><Text style={s.priceVal}>R$ {extraMolhoCost.toFixed(2)}</Text></View>}
          {bebidaCost > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>Bebidas</Text><Text style={s.priceVal}>R$ {bebidaCost.toFixed(2)}</Text></View>}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total:</Text>
            <Text style={s.totalValue}>R$ {totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[s.confirmButton, (!choice || selectedMolhos.length < 1 || submitting) && s.disabledButton]}
            onPress={handleCheckout} disabled={submitting || !choice || selectedMolhos.length < 1}>
            <Text style={s.confirmText}>{submitting ? 'Enviando...' : 'Confirmar Barca'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 16, paddingBottom: 120 },
  backButton: { marginTop: 30, marginBottom: 10 },
  backButtonText: { color: theme.colors.primaryDark, fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 16 },
  mainProduct: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center', elevation: 2, marginBottom: 20 },
  productImage: { width: 80, height: 80, marginRight: 12 },
  productName: { fontSize: 17, fontWeight: 'bold', color: theme.colors.textPrimary },
  productPrice: { fontSize: 17, fontWeight: '800', color: theme.colors.primary, marginTop: 4 },
  productDesc: { fontSize: 12, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 2, marginTop: 8 },
  sectionSub: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 10 },
  choiceRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  choiceBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#EFEFEF', backgroundColor: '#FFF', alignItems: 'center' },
  choiceBtnActive: { borderColor: theme.colors.primary, backgroundColor: '#fdf7ee' },
  choiceBtnText: { fontSize: 15, fontWeight: '700', color: theme.colors.textSecondary, textAlign: 'center' },
  choiceBtnTextActive: { color: theme.colors.primaryDark },
  counter: { fontSize: 13, color: theme.colors.primary, fontWeight: 'bold', marginBottom: 10 },
  list: { marginBottom: 12 },
  itemCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 10, borderRadius: 10, marginBottom: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  itemCardSel: { borderColor: theme.colors.primary, backgroundColor: '#fdf7ee' },
  itemCardExtra: { borderColor: theme.colors.error, backgroundColor: '#fff5f5' },
  itemImage: { width: 44, height: 44, marginRight: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
  itemPrice: { fontSize: 12, color: theme.colors.primary, fontWeight: '700', marginTop: 2 },
  textSel: { color: theme.colors.primaryDark },
  freeBadge: { fontSize: 11, color: '#27ae60', fontWeight: '700', marginTop: 2 },
  extraBadge: { fontSize: 11, color: theme.colors.error, fontWeight: '700', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', marginLeft: 8 },
  radioSel: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  drinksToggle: { backgroundColor: theme.colors.accent, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  drinksToggleText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  checkoutBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceLabel: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600' },
  priceVal: { fontSize: 14, color: theme.colors.textPrimary, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#EFEFEF', paddingTop: 10, marginTop: 4, marginBottom: 14 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  totalValue: { fontSize: 20, fontWeight: '900', color: theme.colors.primary },
  confirmButton: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  disabledButton: { backgroundColor: '#CCC' },
  confirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

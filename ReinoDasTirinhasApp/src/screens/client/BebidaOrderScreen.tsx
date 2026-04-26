import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { resolveProductImage } from '../../utils/productImages';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BebidaOrder'>;

const IS_MORANGO = (name: string) => name.toLowerCase().includes('morango');

export default function BebidaOrderScreen({ route, navigation }: Props) {
  const { product, user } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      const orderNumber = 'RT-' + Math.floor(Math.random() * 10000);
      const { data: orderRow, error: oErr } = await supabase.from('orders').insert({
        user_id: user.id, order_number: orderNumber,
        status: 'Recebido na Cozinha', total_amount: product.price,
      }).select('id').single<{ id: number }>();
      if (oErr || !orderRow) throw oErr;

      const { error: iErr } = await supabase.from('order_items').insert([
        { order_id: orderRow.id, product_id: product.id, quantity: 1, unit_price: product.price },
      ]);
      if (iErr) throw iErr;

      Alert.alert('Bebida Pedida!', `Ordem ${orderNumber} na cozinha, ${user.name}!`,
        [{ text: 'Voltar ao Cardápio', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Menu', params: { user } }] }) }]);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Houve um problema. Tente novamente.');
    } finally { setSubmitting(false); }
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Text style={s.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bebida</Text>

        <View style={s.card}>
          <Image source={resolveProductImage(product.image)} style={s.img} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{product.name}</Text>
            <Text style={s.price}>R$ {product.price.toFixed(2)}</Text>
            <Text style={s.desc}>{product.description}</Text>
          </View>
        </View>

        {/* Dica especial para Soda Italiana Morango */}
        {IS_MORANGO(product.name) && (
          <View style={s.tipBox}>
            <Text style={s.tipTitle}>💡 Dica da Casa</Text>
            <Text style={s.tipText}>
              Experimente misturar com Maracujá! A combinação de morango com maracujá
              é um dos segredos mais pedidos aqui no Reino. 🍓🌸
            </Text>
          </View>
        )}

        <View style={s.checkoutBox}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total:</Text>
            <Text style={s.totalValue}>R$ {product.price.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[s.confirmButton, submitting && s.disabledButton]}
            onPress={handleCheckout} disabled={submitting}>
            <Text style={s.confirmText}>{submitting ? 'Enviando...' : 'Pedir esta Bebida'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 16, paddingBottom: 100 },
  backButton: { marginTop: 30, marginBottom: 10 },
  backButtonText: { color: theme.colors.primaryDark, fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 16 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 14, alignItems: 'center', elevation: 2, marginBottom: 20 },
  img: { width: 90, height: 90, marginRight: 14 },
  name: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  price: { fontSize: 18, fontWeight: '900', color: theme.colors.primary, marginTop: 4 },
  desc: { fontSize: 12, color: '#888', marginTop: 6 },
  tipBox: { backgroundColor: '#FFF9E6', borderLeftWidth: 4, borderLeftColor: theme.colors.primary, padding: 14, borderRadius: 10, marginBottom: 20 },
  tipTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.primaryDark, marginBottom: 6 },
  tipText: { fontSize: 13, color: theme.colors.textPrimary, lineHeight: 20 },
  checkoutBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  totalValue: { fontSize: 20, fontWeight: '900', color: theme.colors.primary },
  confirmButton: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  disabledButton: { backgroundColor: '#CCC' },
  confirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

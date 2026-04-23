import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { getStatusColor } from '../../constants/orderStatus';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MyOrders'>;

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  products: { name: string } | null;
}

interface OrderRow {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItemRow[];
}

export default function MyOrdersScreen({ route, navigation }: Props) {
  const { user } = route.params;
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, total_amount, created_at,
        order_items ( quantity, unit_price, products ( name ) )
      `)
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setOrders((data ?? []) as unknown as OrderRow[]);
    }
    setRefreshing(false);
  }, [user.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const renderOrder = ({ item }: { item: OrderRow }) => {
    const colors = getStatusColor(item.status);
    const itemLines = item.order_items
      .map((oi) => oi.products?.name)
      .filter((n): n is string => !!n);
    return (
      <View style={[styles.orderCard, { borderLeftColor: colors.text }]}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          <Text style={[styles.orderStatus, { backgroundColor: colors.bg, color: colors.text }]}>
            {item.status}
          </Text>
        </View>

        <View style={styles.itemsBox}>
          <Text style={styles.orderItemsTitle}>Itens:</Text>
          {itemLines.map((name, index) => (
            <Text key={index} style={styles.orderItem}>• {name}</Text>
          ))}
        </View>

        <Text style={styles.orderTotal}>Total: R$ {item.total_amount.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={26} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Você ainda não fez nenhum pedido. Volte ao cardápio e monte seu combo!
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.surface,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
  },
  backButton: { position: 'absolute', left: 16, bottom: 18, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 15, paddingHorizontal: 32 },
  orderCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
    borderLeftWidth: 5,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNumber: { fontSize: 18, fontWeight: '900', color: '#111' },
  orderStatus: { fontSize: 13, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, fontWeight: 'bold', overflow: 'hidden' },
  itemsBox: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, marginBottom: 12 },
  orderItemsTitle: { fontSize: 12, color: '#666', fontWeight: 'bold', marginBottom: 6 },
  orderItem: { fontSize: 14, color: '#111', fontWeight: '600', marginBottom: 4 },
  orderTotal: { fontSize: 16, fontWeight: '900', color: '#27ae60', textAlign: 'right' },
});

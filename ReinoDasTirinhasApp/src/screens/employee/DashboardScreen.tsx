import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { getStatusColor, getNextStatus } from '../../constants/orderStatus';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

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
  profiles: { name: string } | null;
  order_items: OrderItemRow[];
}

export default function DashboardScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, total_amount, created_at,
        profiles ( name ),
        order_items ( quantity, unit_price, products ( name ) )
      `)
      .order('id', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setOrders((data ?? []) as unknown as OrderRow[]);
    }
    setRefreshing(false);
  }, []);

  const advanceStatus = async (order: OrderRow) => {
    const next = getNextStatus(order.status);
    if (!next) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: next })
      .eq('id', order.id);

    if (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: next } : o))
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigation.replace('Splash');
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('orders-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const renderOrder = ({ item }: { item: OrderRow }) => {
    const colors = getStatusColor(item.status);
    const next = getNextStatus(item.status);
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
        <Text style={styles.customerName}>Realeza: {item.profiles?.name ?? '—'}</Text>

        <View style={styles.itemsBox}>
           <Text style={styles.orderItemsTitle}>Itens Solicitados:</Text>
           {itemLines.map((name, index) => (
               <Text key={index} style={styles.orderItem}>• {name}</Text>
           ))}
        </View>

        <Text style={styles.orderTotal}>Total Pago: R$ {item.total_amount.toFixed(2)}</Text>

        {next && (
          <TouchableOpacity
            style={[styles.advanceButton, { backgroundColor: colors.text }]}
            onPress={() => advanceStatus(item)}
          >
            <Text style={styles.advanceButtonText}>Avançar → {next}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forja (Status)</Text>

        <View style={styles.actionHeader}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutText}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Cozinha Ociosa. Nenhum pedido na fila.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDF2F7' },
  header: { backgroundColor: '#3D2C23', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.background },
  actionHeader: { flexDirection: 'row' },
  logoutButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  logoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  orderCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderLeftWidth: 5 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNumber: { fontSize: 18, fontWeight: '900', color: '#111' },
  orderStatus: { fontSize: 13, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontWeight: 'bold', overflow: 'hidden' },
  customerName: { fontSize: 16, color: '#333', marginBottom: 12 },
  itemsBox: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, marginBottom: 12 },
  orderItemsTitle: { fontSize: 12, color: '#666', fontWeight: 'bold', marginBottom: 6 },
  orderItem: { fontSize: 14, color: '#111', fontWeight: '600', marginBottom: 4 },
  orderTotal: { fontSize: 16, fontWeight: '900', color: '#27ae60', textAlign: 'right' },
  advanceButton: { marginTop: 12, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  advanceButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { getStatusColor, getNextStatus } from '../../constants/orderStatus';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
type Tab = 'orders' | 'elite' | 'metrics';

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

interface EliteCustomer {
  id: string;
  name: string;
  total_orders: number;
  stamps: number;
}

export default function DashboardScreen({ navigation }: Props) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [refreshing, setRefreshing] = useState(false);
  const [eliteCustomers, setEliteCustomers] = useState<EliteCustomer[]>([]);
  const [stats, setStats] = useState({ todayRevenue: 0, todayOrders: 0, totalRevenue: 0 });

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

    if (!error) setOrders((data ?? []) as unknown as OrderRow[]);
    setRefreshing(false);
  }, []);

  const loadElite = async () => {
    // Busca perfis e conta pedidos entregues
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, name, loyalty_stamps');
    
    if (pError || !profiles) return;

    const eliteData = await Promise.all(profiles.map(async (p) => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', p.id)
        .eq('status', 'Entregue');
      
      return {
        id: p.id,
        name: p.name || 'Anônimo',
        total_orders: count || 0,
        stamps: p.loyalty_stamps || 0
      };
    }));

    setEliteCustomers(eliteData.sort((a, b) => b.total_orders - a.total_orders).slice(0, 15));
  };

  const loadStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayOrders, error: sError } = await supabase
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', today.toISOString());

    if (sError || !todayOrders) return;

    const revenue = todayOrders
      .filter(o => o.status !== 'Cancelado')
      .reduce((sum, o) => sum + o.total_amount, 0);

    setStats({
      todayRevenue: revenue,
      todayOrders: todayOrders.length,
      totalRevenue: 0 // Poderia buscar o histórico total se necessário
    });
  };

  useEffect(() => {
    loadOrders();
    loadElite();
    loadStats();
  }, [loadOrders]);

  const advanceStatus = async (order: OrderRow) => {
    const next = getNextStatus(order.status);
    if (!next) return;
    const { error } = await supabase.from('orders').update({ status: next }).eq('id', order.id);
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
      loadStats(); // Atualiza métricas se mudou para entregue
    }
  };

  const renderOrder = ({ item }: { item: OrderRow }) => {
    const colors = getStatusColor(item.status);
    const next = getNextStatus(item.status);
    const itemLines = item.order_items.map(oi => oi.products?.name).filter((n): n is string => !!n);
    return (
      <View style={[styles.orderCard, { backgroundColor: theme.colors.surface, borderLeftColor: colors.text }]}>
        <View style={styles.orderHeader}>
          <Text style={[styles.orderNumber, { color: theme.colors.textPrimary }]}>{item.order_number}</Text>
          <Text style={[styles.orderStatus, { backgroundColor: colors.bg, color: colors.text }]}>{item.status}</Text>
        </View>
        <Text style={[styles.customerName, { color: theme.colors.textSecondary }]}>👑 Realeza: {item.profiles?.name ?? '—'}</Text>
        <View style={[styles.itemsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}>
           <Text style={[styles.orderItemsTitle, { color: theme.colors.textSecondary }]}>Itens Solicitados:</Text>
           {itemLines.map((name, index) => <Text key={index} style={[styles.orderItem, { color: theme.colors.textPrimary }]}>• {name}</Text>)}
        </View>
        <Text style={[styles.orderTotal, { color: theme.colors.primary }]}>Total Pago: R$ {item.total_amount.toFixed(2)}</Text>
        {next && (
          <TouchableOpacity style={[styles.advanceButton, { backgroundColor: colors.text }]} onPress={() => advanceStatus(item)}>
            <Text style={styles.advanceButtonText}>Avançar → {next}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderElite = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadElite(); loadOrders(); }} />} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>🏆 Salão dos Melhores Clientes</Text>
      {eliteCustomers.map((c, i) => (
        <View key={c.id} style={[styles.eliteCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.rankBadge, { backgroundColor: i < 3 ? '#F0B955' : theme.colors.primaryDark }]}>
            <Text style={styles.rankText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eliteName, { color: theme.colors.textPrimary }]}>{c.name}</Text>
            <Text style={[styles.eliteStats, { color: theme.colors.textSecondary }]}>{c.total_orders} pedidos entregues • {c.stamps} selos de Rei</Text>
          </View>
          {i === 0 && <Feather name="award" size={24} color="#F0B955" />}
        </View>
      ))}
    </ScrollView>
  );

  const renderMetrics = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadStats(); loadOrders(); }} />} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>📊 Balanço do Dia</Text>
      
      <View style={styles.metricsGrid}>
        <View style={[styles.metricBox, { backgroundColor: theme.colors.surface }]}>
          <Feather name="dollar-sign" size={24} color="#27ae60" />
          <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>R$ {stats.todayRevenue.toFixed(2)}</Text>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Receita de Hoje</Text>
        </View>
        <View style={[styles.metricBox, { backgroundColor: theme.colors.surface }]}>
          <Feather name="shopping-bag" size={24} color={theme.colors.primary} />
          <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>{stats.todayOrders}</Text>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Pedidos Totais</Text>
        </View>
      </View>

      <View style={[styles.infoBanner, { backgroundColor: theme.colors.primaryDark }]}>
        <Feather name="info" size={20} color="#FFF" />
        <Text style={styles.infoText}>Métricas baseadas em pedidos não cancelados.</Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Centro de Comando</Text>
          <Text style={[styles.headerSub, { color: theme.colors.primary }]}>Chefe Felipe 👨‍🍳</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.headerIcon} onPress={toggleTheme}>
            <Feather name={isDark ? "sun" : "moon"} size={22} color={theme.colors.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={async () => { await supabase.auth.signOut(); navigation.replace('Splash'); }}>
            <Feather name="log-out" size={22} color={theme.colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={[styles.tab, activeTab === 'orders' && styles.activeTab]} onPress={() => setActiveTab('orders')}>
          <Feather name="list" size={18} color={activeTab === 'orders' ? theme.colors.primary : '#888'} />
          <Text style={[styles.tabText, { color: activeTab === 'orders' ? theme.colors.primary : '#888' }]}>Pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'elite' && styles.activeTab]} onPress={() => setActiveTab('elite')}>
          <Feather name="users" size={18} color={activeTab === 'elite' ? theme.colors.primary : '#888'} />
          <Text style={[styles.tabText, { color: activeTab === 'elite' ? theme.colors.primary : '#888' }]}>Elite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'metrics' && styles.activeTab]} onPress={() => setActiveTab('metrics')}>
          <Feather name="pie-chart" size={18} color={activeTab === 'metrics' ? theme.colors.primary : '#888'} />
          <Text style={[styles.tabText, { color: activeTab === 'metrics' ? theme.colors.primary : '#888' }]}>Métricas</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'orders' && (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Cozinha Ociosa. Nenhum pedido na fila.</Text>}
        />
      )}
      {activeTab === 'elite' && renderElite()}
      {activeTab === 'metrics' && renderMetrics()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  headerSub: { fontSize: 13, fontWeight: '700', marginTop: -2 },
  headerIcon: { padding: 8 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, elevation: 2 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  activeTab: { backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  tabText: { fontSize: 13, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
  orderCard: { padding: 16, borderRadius: 12, marginBottom: 16, elevation: 3, borderLeftWidth: 5 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNumber: { fontSize: 18, fontWeight: '900' },
  orderStatus: { fontSize: 13, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontWeight: 'bold', overflow: 'hidden' },
  customerName: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  itemsBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  orderItemsTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  orderItem: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  orderTotal: { fontSize: 17, fontWeight: '900', textAlign: 'right' },
  advanceButton: { marginTop: 12, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  advanceButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  eliteCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10, elevation: 1 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rankText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  eliteName: { fontSize: 16, fontWeight: 'bold' },
  eliteStats: { fontSize: 12, marginTop: 2 },
  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metricBox: { flex: 1, padding: 20, borderRadius: 15, alignItems: 'center', elevation: 2 },
  metricValue: { fontSize: 20, fontWeight: '900', marginVertical: 8 },
  metricLabel: { fontSize: 11, fontWeight: 'bold' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 10 },
  infoText: { color: '#FFF', fontSize: 11, fontWeight: '600' }
});

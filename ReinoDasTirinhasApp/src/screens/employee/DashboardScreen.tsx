import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function DashboardScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // A função MÁGICA para o Felipe poder ver o banco de dados no PC dele
  const exportDatabase = async () => {
    try {
      const dbPath = FileSystem.documentDirectory + 'SQLite/reino_das_tirinhas.db';
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      if (!fileInfo.exists) {
        Alert.alert('Erro', 'O Banco de dados não foi encontrado fisicamente.');
        return;
      }

      await Sharing.shareAsync(dbPath, { dialogTitle: 'Exportar Banco de Dados' });
    } catch (err) {
      console.error(err);
      Alert.alert('Ops!', 'Não foi possível exportar.');
    }
  };

  const loadOrders = async () => {
    setRefreshing(true);
    try {
      const db = await SQLite.openDatabaseAsync('reino_das_tirinhas.db');
      
      // Update the join from Customer legada para User novo
      const query = `
        SELECT 
          o.id as order_id, o.order_number, o.status, o.total_amount, u.name as customer_name,
          (
            SELECT GROUP_CONCAT(p.name, ' | ') 
            FROM OrderItem oi 
            JOIN Product p ON oi.product_id = p.id 
            WHERE oi.order_id = o.id
          ) as items
        FROM Orders o
        JOIN User u ON o.user_id = u.id
        ORDER BY o.id DESC
      `;
      const result = await db.getAllAsync(query);
      setOrders(result);
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.order_number}</Text>
        <Text style={styles.orderStatus}>{item.status}</Text>
      </View>
      <Text style={styles.customerName}>Realeza: {item.customer_name}</Text>
      
      <View style={styles.itemsBox}>
         <Text style={styles.orderItemsTitle}>Itens Solicitados:</Text>
         {item.items.split(' | ').map((i: string, index: number) => (
             <Text key={index} style={styles.orderItem}>• {i}</Text>
         ))}
      </View>

      <Text style={styles.orderTotal}>Total Pago: R$ {item.total_amount.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forja (Status)</Text>
        
        <View style={styles.actionHeader}>
          {/* BOTÃO EXPORTAR BANCO DE DADOS */}
          <TouchableOpacity style={[styles.logoutButton, {backgroundColor: '#e74c3c', marginRight: 10}]} onPress={exportDatabase}>
            <Text style={styles.logoutText}>EXPORTAR .DB</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.replace('Splash')}>
            <Text style={styles.logoutText}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.order_id.toString()}
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
  orderCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderLeftWidth: 5, borderLeftColor: theme.colors.primary },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderNumber: { fontSize: 18, fontWeight: '900', color: '#111' },
  orderStatus: { fontSize: 13, backgroundColor: 'rgba(228, 156, 44, 0.2)', color: theme.colors.primaryDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontWeight: 'bold', overflow: 'hidden' },
  customerName: { fontSize: 16, color: '#333', marginBottom: 12 },
  itemsBox: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, marginBottom: 12 },
  orderItemsTitle: { fontSize: 12, color: '#666', fontWeight: 'bold', marginBottom: 6 },
  orderItem: { fontSize: 14, color: '#111', fontWeight: '600', marginBottom: 4 },
  orderTotal: { fontSize: 16, fontWeight: 'black', color: '#27ae60', textAlign: 'right' }
});

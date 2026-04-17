import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { theme } from '../../constants/theme';

export default function OrderBuilderScreen({ route, navigation }: any) {
  const db = useSQLiteContext();
  const { product, user } = route.params; // Agora recebe o user da navegação (User autenticado)
  const [sauces, setSauces] = useState<any[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<number[]>([]);

  useEffect(() => {
    const fetchSauces = async () => {
      const rows = await db.getAllAsync('SELECT * FROM Product WHERE category = "Molho"');
      setSauces(rows);
    };
    fetchSauces();
  }, []);

  const toggleSauce = (id: number) => {
    if (selectedSauces.includes(id)) {
      setSelectedSauces(selectedSauces.filter(s => s !== id));
    } else {
      if (selectedSauces.length >= 2) {
        Alert.alert('Limite Alcançado', 'Você já escolheu seus 2 molhos premium no Combo!');
      } else {
        setSelectedSauces([...selectedSauces, id]);
      }
    }
  };

  const handleCheckout = async () => {
    if (selectedSauces.length !== 2) {
      Alert.alert('Atenção', 'Você DEVE selecionar exatamente 2 molhos para acompanhar.');
      return;
    }

    try {
      
      const orderNumber = 'RT-' + Math.floor(Math.random() * 10000);
      
      // Inserimos a Ordem usando o user_id real do Banco
      const orderResult = await db.runAsync(
          'INSERT INTO Orders (user_id, order_number, status, total_amount) VALUES (?, ?, ?, ?)',
          [user.id, orderNumber, 'Recebido na Cozinha', product.price]
      );
      const orderId = orderResult.lastInsertRowId;

      await db.runAsync('INSERT INTO OrderItem (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)', [orderId, product.id, 1, product.price]);
      await db.runAsync('INSERT INTO OrderItem (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)', [orderId, selectedSauces[0], 1, 0]);
      await db.runAsync('INSERT INTO OrderItem (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)', [orderId, selectedSauces[1], 1, 0]);

      Alert.alert('Pedido Oficial Efetuado!', `Sua ordem ${orderNumber} acabou de chegar à nossa cozinha sr(a) ${user.name}.`, [
        { text: 'Voltar ao Cardápio', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Menu', params: { user } }] }) }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Houve um problema. Tente Novamente.');
    }
  };

  const resolveImage = (imageName: string) => {
    switch (imageName) {
      case 'tirinhas_300.png': return require('../../../assets/products/tirinhas_300.png');
      case 'tirinhas_500.png': return require('../../../assets/products/tirinhas_500.png');
      case 'tirinhas_700.png': return require('../../../assets/products/tirinhas_700.png');
      case 'alho_limao.png': return require('../../../assets/products/alho_limao.png');
      case 'baconese.png': return require('../../../assets/products/baconese.png');
      case 'defumado.png': return require('../../../assets/products/defumado.png');
      case 'ervas_finas.png': return require('../../../assets/products/ervas_finas.png');
      case 'proteico.png': return require('../../../assets/products/proteico.png');
      default: return require('../../../assets/logo2.jpg');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Montar Combinação</Text>
        
        <View style={styles.mainProduct}>
           <Image source={resolveImage(product.image)} style={styles.productImage} resizeMode="contain" />
           <View style={{flex: 1}}>
             <Text style={styles.productName}>{product.name}</Text>
             <Text style={styles.productPrice}>R$ {product.price.toFixed(2)}</Text>
             <Text style={styles.productDesc}>{product.description}</Text>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Escolha 2 Molhos Exclusivos:</Text>
        <Text style={styles.counter}>{selectedSauces.length} / 2 selecionados</Text>

        <View style={styles.saucelist}>
          {sauces.map((sauce) => {
            const isSelected = selectedSauces.includes(sauce.id);
            return (
              <TouchableOpacity 
                key={sauce.id} 
                style={[styles.sauceCard, isSelected && styles.sauceCardSelected]} 
                onPress={() => toggleSauce(sauce.id)}
              >
                <Image source={resolveImage(sauce.image)} style={styles.sauceImage} />
                <View style={{flex:1}}>
                   <Text style={[styles.sauceName, isSelected && styles.textSelected]}>{sauce.name}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]} />
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.checkoutBox}>
           <TouchableOpacity 
             style={[styles.confirmButton, selectedSauces.length !== 2 ? styles.disabledButton : null]} 
             onPress={handleCheckout}
           >
             <Text style={styles.confirmText}>Pedir Agora e Saborear</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 16, paddingBottom: 100 },
  backButton: { marginTop: 30, marginBottom: 10 },
  backButtonText: { color: theme.colors.primaryDark, fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 16 },
  mainProduct: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2, marginBottom: 20 },
  productImage: { width: 90, height: 90, marginRight: 16 },
  productName: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  productPrice: { fontSize: 18, fontWeight: '800', color: theme.colors.primary, marginTop: 4 },
  productDesc: { fontSize: 13, color: '#888', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  counter: { fontSize: 14, color: theme.colors.primary, fontWeight: 'bold', marginBottom: 16 },
  saucelist: { marginBottom: 20 },
  sauceCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  sauceCardSelected: { borderColor: theme.colors.primary, backgroundColor: '#fdf7ee' },
  sauceImage: { width: 50, height: 50, marginRight: 12 },
  sauceName: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
  textSelected: { color: theme.colors.primaryDark },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ddd', marginLeft: 10 },
  radioSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  checkoutBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05 },
  confirmButton: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  disabledButton: { backgroundColor: '#CCC' },
  confirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

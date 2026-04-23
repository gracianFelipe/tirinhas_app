import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { resolveProductImage } from '../../utils/productImages';
import { Product, RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

type SectionHeader = { id: string; type: 'header'; title: string };
type ListEntry = Product | SectionHeader;

export default function MenuScreen({ route, navigation }: Props) {
  const user = route.params?.user;
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, category, image')
        .order('id', { ascending: true });
      if (error) {
        console.error(error);
        return;
      }
      setProducts((data ?? []) as Product[]);
    };
    fetchProducts();
  }, []);

  const tirinhas = products.filter(p => p.category === 'Tirinha');
  const molhos = products.filter(p => p.category === 'Molho');

  const renderItem = ({ item }: { item: Product }) => {
    const isTirinha = item.category === 'Tirinha';
    return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={isTirinha ? 0.7 : 1}
      onPress={() => {
        if (isTirinha) {
          if (!user) {
            Alert.alert('Conta Necessária', 'Você precisa de uma conta de realeza para pedir nosso frango!', [{ text: 'Fazer Login Agora', onPress: () => navigation.replace('Splash') }]);
          } else {
            navigation.navigate('OrderBuilder', { product: item, user });
          }
        }
      }}
    >
      <Image source={resolveProductImage(item.image)} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        {item.price > 0 && <Text style={styles.cardPrice}>R$ {item.price.toFixed(2)}</Text>}
        {isTirinha && <Text style={{color: theme.colors.primary, marginTop: 10, fontSize: 13, fontWeight: 'bold'}}>+ ADICIONAR AO COMBO</Text>}
      </View>
    </TouchableOpacity>
    );
  };

  const listData: ListEntry[] = [
    { id: 'header-tirinhas', type: 'header', title: 'Tirinhas Crocantes (Escolha 2 Molhos)' },
    ...tirinhas,
    { id: 'header-molhos', type: 'header', title: 'Molhos Premium Extras' },
    ...molhos,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={async () => {
            await supabase.auth.signOut();
            navigation.replace('Splash');
          }}
        >
          <Feather name="log-out" size={26} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cardápio</Text>
        {user && (
          <TouchableOpacity
            style={styles.ordersButton}
            onPress={() => navigation.navigate('MyOrders', { user })}
          >
            <Feather name="clipboard" size={24} color={theme.colors.primaryDark} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({item}) => {
          if ('type' in item && item.type === 'header') {
            return <Text style={styles.sectionHeader}>{item.title}</Text>;
          }
          return renderItem({ item: item as Product });
        }}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
  },
  homeButton: {
    position: 'absolute',
    left: 16,
    bottom: 18,
    padding: 6,
  },
  ordersButton: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    padding: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    marginVertical: 16,
    marginLeft: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
  }
});

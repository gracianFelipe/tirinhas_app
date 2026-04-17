import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function MenuScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('reino_das_tirinhas.db');
        const rows = await db.getAllAsync('SELECT * FROM Product');
        setProducts(rows);
      } catch (e) {
        console.error(e);
      }
    };
    fetchProducts();
  }, []);

  const tirinhas = products.filter(p => p.category === 'Tirinha');
  const molhos = products.filter(p => p.category === 'Molho');

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

  const renderItem = ({ item }: { item: any }) => {
    const isTirinha = item.category === 'Tirinha';
    return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={isTirinha ? 0.7 : 1}
      onPress={() => {
        if (isTirinha) {
          navigation.navigate('OrderBuilder', { product: item });
        }
      }}
    >
      <Image source={resolveImage(item.image)} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        {item.price > 0 && <Text style={styles.cardPrice}>R$ {item.price.toFixed(2)}</Text>}
        {isTirinha && <Text style={{color: theme.colors.primary, marginTop: 10, fontSize: 13, fontWeight: 'bold'}}>+ ADICIONAR AO COMBO</Text>}
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={() => navigation.replace('Splash')}
        >
          <Feather name="home" size={26} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cardápio</Text>
      </View>
      
      <FlatList
        data={[{id: 'header-tirinhas', type: 'header', title: 'Tirinhas Crocantes (Escolha 2 Molhos)'}, ...tirinhas, {id: 'header-molhos', type: 'header', title: 'Molhos Premium Extras'}, ...molhos]}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({item}) => {
          if (item.type === 'header') {
            return <Text style={styles.sectionHeader}>{item.title}</Text>;
          }
          return renderItem({item});
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

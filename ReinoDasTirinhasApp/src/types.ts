export type UserRole = 'client' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string | null;
}

export type ProductCategory = 'Tirinha' | 'Molho';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Menu: { user?: User } | undefined;
  OrderBuilder: { product: Product; user: User };
  Dashboard: { user: User };
  MyOrders: { user: User };
};

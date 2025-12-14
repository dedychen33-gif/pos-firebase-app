export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BundleItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  barcode: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  description?: string;
  imageUrl?: string;
  isBundle: boolean;
  bundleItems?: BundleItem[];
  createdAt: number;
  updatedAt: number;
}

export interface CustomerPrice {
  productId: string;
  customPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  customPrices?: CustomerPrice[];
  createdAt: number;
  updatedAt: number;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'received' | 'cancelled';
  orderDate: number;
  shippedDate?: number;
  receivedDate?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
  paymentStatus?: 'paid' | 'unpaid';
  dueDate?: number;
  saleDate: number;
  paidDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'kasir';
  createdAt: number;
  updatedAt: number;
}

export interface BackupData {
  products: Record<string, Product>;
  categories: Record<string, Category>;
  customers: Record<string, Customer>;
  suppliers: Record<string, Supplier>;
  purchaseOrders: Record<string, PurchaseOrder>;
  sales: Record<string, Sale>;
  timestamp: number;
}

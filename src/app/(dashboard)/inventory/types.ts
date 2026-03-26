export interface InventoryItem {
  sku: string;
  name: string;
  spec: string;
  storageUnit: string;
  conversionRate: number;
  stock: number;
  price: number;
  retailPrice: number;
  daysToReorder: number;
  expDate: string;
  status: 'Đang KD' | 'Ngừng KD' | string;
  batches?: { expDate: string; qty: number }[];
}

export interface OrderItem {
  productId: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  supplier: string;
  qty: number;
  spec: string;
  price: number;
  date: string;
  status: 'Hàng chờ về' | 'Đã nhập kho' | string;
  items: OrderItem[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
  address: string;
  debt: number;
  status: 'Đang hợp tác' | 'Ngừng hợp tác' | string;
}

export interface GrnItem {
  id: number;
  productId: string;
  qty: number;
  price: number;
  expDate: string;
}

export interface PoItem {
  id: number;
  productId: string;
  qty: number;
  price: number;
}

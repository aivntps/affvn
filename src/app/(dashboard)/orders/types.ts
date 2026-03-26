export interface SaleOrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export type OrderStatus = "Chờ duyệt" | "Đang giao" | "Chưa TT" | "Đã thanh toán" | "Đã hủy";

export interface SaleOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerType: string;
  customerRegion: string;
  date: string;
  paymentDate: string;
  total: number;
  status: OrderStatus;
  items: SaleOrderItem[];
  staffId: string;
  staffName: string;
}

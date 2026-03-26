"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateSaleOrderStatus as updateSaleOrderAction, receiveStockFromPO as receiveStockAction, saveCompanyInfoAction, saveInventoryConfigAction, getCachedInventory } from "@/app/(dashboard)/inventory/actions";

// --- Types ---
export interface Staff {
  id: string;
  tai_khoan?: string;
  ho_ten: string;
  vai_tro: string;
  khu_vuc_quan_ly?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  region: string;
  type: string;
  status: string;
  sales: number;
}

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
  status: string;
  batches?: any[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
  address: string;
  debt: number;
  status: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  qty: number;
  spec: string;
  price: number;
  date: string;
  status: string;
  items: any[];
}

export interface SaleOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerType: string;
  customerRegion: string;
  date: string;
  paymentDate: string;
  total: number;
  status: "Chờ duyệt" | "Đang giao" | "Chưa TT" | "Đã thanh toán" | "Đã hủy";
  items: any[];
  staffId: string;
  staffName: string;
}

export interface DebtInvoice {
  id: string;
  customerId?: string; // Tùy chọn: Dùng cho khách hàng
  supplierId?: string; // Tùy chọn: Dùng cho nhà cung cấp
  remainingDebt: number;
  dueDate: string;
  status: "Trong hạn" | "Quá hạn" | "Đã thanh toán";
}

export interface CompanyInfo {
  name: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
  logoUrl: string;
}

export interface InventoryConfig {
  leadTimeAvg: number;
  leadTimeMax: number;
  maxCapacity: number;
  minMoq: number;
  storageCost: number;
  expWarningDays: number;
}

// --- Initial Data ---
const initialCompanyInfo: CompanyInfo = {
  name: "ASEAN FINE FOODS",
  taxId: "0312345678",
  address: "123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM",
  email: "contact@aseanfinefoods.com",
  phone: "1900 1234",
  logoUrl: "https://marigold.com.vn/wp-content/uploads/2021/04/logo-marigold.svg",
};

const initialInventoryConfig: InventoryConfig = {
  leadTimeAvg: 5,
  leadTimeMax: 10,
  maxCapacity: 10000,
  minMoq: 100,
  storageCost: 5000,
  expWarningDays: 90
};

// --- Context Definition ---
interface GlobalContextType {
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
  
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  
  saleOrders: SaleOrder[];
  setSaleOrders: React.Dispatch<React.SetStateAction<SaleOrder[]>>;
  
  debtInvoices: DebtInvoice[];
  setDebtInvoices: React.Dispatch<React.SetStateAction<DebtInvoice[]>>;

  companyInfo: CompanyInfo;
  setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;

  inventoryConfig: InventoryConfig;
  setInventoryConfig: React.Dispatch<React.SetStateAction<InventoryConfig>>;

  updateSaleOrderStatus: (orderId: string, newStatus: SaleOrder["status"]) => void;
  receiveStockFromPO: (poId: string, batches?: any[]) => void;
  saveCompanyInfoAction: (info: any) => Promise<{ error: string | null }>;
  saveInventoryConfigAction?: (config: any) => Promise<{ error: string | null }>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>([]);
  const [debtInvoices, setDebtInvoices] = useState<DebtInvoice[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [inventoryConfig, setInventoryConfig] = useState<InventoryConfig>(initialInventoryConfig);

  const supabase = createClient();

  const fetchData = async () => {
    // Mảng các Promise để fetch dữ liệu song song thay vì tuần tự
    const [
      { data: custData },
      invData,
      { data: supData },
      { data: poData },
      { data: soData },
      { data: debtData },
      { data: staffData },
      { data: compData },
      { data: settingsData }
    ] = await Promise.all([
      supabase.from('customers').select('id, name, phone, region, type, status, sales').order('created_at', { ascending: false }),
      getCachedInventory(),
      supabase.from('suppliers').select('id, name, contact, category, address, debt, status').order('created_at', { ascending: false }),
      supabase.from('purchase_orders').select('id, supplier, qty, spec, price, date, status, po_items(product_id, qty, price)').order('created_at', { ascending: false }),
      supabase.from('sale_orders').select('id, customer_id, customer_name, customer_type, customer_region, date, payment_date, total, status, staff_id, staff_name, sale_order_items(product_id, name, qty, price)').order('created_at', { ascending: false }),
      supabase.from('debt_invoices').select('id, customer_id, supplier_id, remaining_debt, due_date, status').order('created_at', { ascending: false }),
      supabase.from('ho_so_nhan_vien').select('id, tai_khoan, ho_ten, vai_tro, khu_vuc_quan_ly'),
      supabase.from('company_info').select('name, tax_id, address, email, phone, logo_url').eq('id', 1).single(),
      supabase.from('app_settings').select('value').eq('key', 'inventory_config').maybeSingle()
    ]);

    if (custData) setCustomers(custData.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone, region: c.region, type: c.type, status: c.status, sales: Number(c.sales) })));
    
    if (invData) {
      setInventory(invData.map((i: any) => ({
        sku: i.sku, name: i.name, spec: i.spec, storageUnit: i.storage_unit, conversionRate: Number(i.conversion_rate), stock: Number(i.stock), price: Number(i.price), retailPrice: Number(i.retail_price || 0), daysToReorder: Number(i.days_to_reorder), expDate: i.exp_date, status: i.status,
        batches: i.inventory_batches?.map((b: any) => ({ expDate: b.exp_date, qty: Number(b.qty) })) || []
      })));
    }

    if (supData) setSuppliers(supData.map((s: any) => ({ id: s.id, name: s.name, contact: s.contact, category: s.category, address: s.address, debt: Number(s.debt), status: s.status })));
    
    if (poData) {
      setPurchaseOrders(poData.map((p: any) => ({
        id: p.id, supplier: p.supplier, qty: Number(p.qty), spec: p.spec, price: Number(p.price), date: p.date, status: p.status,
        items: p.po_items?.map((pi: any) => ({ productId: pi.product_id, qty: Number(pi.qty), price: Number(pi.price) })) || []
      })));
    }

    if (soData) {
      setSaleOrders(soData.map((s: any) => ({
        id: s.id, customerId: s.customer_id, customerName: s.customer_name, customerType: s.customer_type, customerRegion: s.customer_region, date: s.date, paymentDate: s.payment_date, total: Number(s.total), status: s.status as any, staffId: s.staff_id, staffName: s.staff_name,
        items: s.sale_order_items?.map((si: any) => ({ productId: si.product_id, name: si.name, qty: Number(si.qty), price: Number(si.price) })) || []
      })));
    }

    if (debtData) setDebtInvoices(debtData.map((d: any) => ({ id: d.id, customerId: d.customer_id, supplierId: d.supplier_id, remainingDebt: Number(d.remaining_debt), dueDate: d.due_date, status: d.status as any })));
    
    if (staffData) setStaffList(staffData.map((s: any) => ({ id: s.id, tai_khoan: s.tai_khoan, ho_ten: s.ho_ten, vai_tro: s.vai_tro, khu_vuc_quan_ly: s.khu_vuc_quan_ly })));

    if (compData) {
      const newInfo = { name: compData.name, taxId: compData.tax_id, address: compData.address, email: compData.email, phone: compData.phone, logoUrl: compData.logo_url };
      setCompanyInfo(newInfo);
      localStorage.setItem('aff_company_info', JSON.stringify(newInfo));
    }

    if (settingsData && settingsData.value) {
      setInventoryConfig(settingsData.value as InventoryConfig);
      localStorage.setItem('aff_inventory_config', JSON.stringify(settingsData.value));
    }
  };

  useEffect(() => {
    // 1. Thử lấy từ cache trước để hiện logo/settings nhanh
    const cachedInfo = localStorage.getItem('aff_company_info');
    if (cachedInfo) {
      setCompanyInfo(JSON.parse(cachedInfo));
    }
    
    const cachedConfig = localStorage.getItem('aff_inventory_config');
    if (cachedConfig) {
      setInventoryConfig(JSON.parse(cachedConfig));
    }
    
    // 2. Sau đó mới fetch dữ liệu mới nhất từ DB
    fetchData();
  }, []);

  // LOGIC: Update Order Status via Server Actions RPC
  const updateSaleOrderStatus = async (orderId: string, newStatus: SaleOrder["status"]) => {
    // Optimistic Update
    setSaleOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Real Update
    const res = await updateSaleOrderAction(orderId, newStatus);
    if (!res?.error) {
      fetchData(); // Refresh all related data
    } else {
      alert("Lỗi cập nhật hệ thống: " + res.error);
      fetchData(); // Rollback on failure
    }
  };

  // LOGIC: Receive Stock via Server Actions RPC
  const receiveStockFromPO = async (poId: string, batches?: any[]) => {
    if (!batches || batches.length === 0) return;
    
    // Optimistic Update
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'Đã nhập kho' } : p));
    
    // Real Update
    const res = await receiveStockAction(poId, batches);
    if (!res?.error) {
      fetchData(); // Refresh all related data
    } else {
      alert("Lỗi nhập kho: " + res.error);
      fetchData(); // Rollback on failure
    }
  };

  const value = {
    staffList, setStaffList,
    customers, setCustomers,
    inventory, setInventory,
    suppliers, setSuppliers,
    purchaseOrders, setPurchaseOrders,
    saleOrders, setSaleOrders,
    debtInvoices, setDebtInvoices,
    companyInfo, setCompanyInfo,
    inventoryConfig, setInventoryConfig,
    updateSaleOrderStatus,
    receiveStockFromPO,
    saveCompanyInfoAction,
    saveInventoryConfigAction
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalData() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobalData must be used within a GlobalProvider");
  }
  return context;
}

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
  minMoq: number;
  leadTimeAvg: number;
  leadTimeMax: number;
  maxCapacity: number;
  storageCost: number;
  expWarningDays: number;
  returnExpiryMonths: number;
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
  minMoq: 100,
  leadTimeAvg: 20,
  leadTimeMax: 30,
  maxCapacity: 10000,
  storageCost: 5000,
  expWarningDays: 90,
  returnExpiryMonths: 6
};

// --- Context Definition ---
interface GlobalContextType {
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;

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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [inventoryConfig, setInventoryConfig] = useState<InventoryConfig>(initialInventoryConfig);

  const supabase = createClient();

  const fetchData = async () => {
    const [
      invData,
      { data: supData },
      { data: staffData },
      { data: compData },
      { data: settingsData }
    ] = await Promise.all([
      getCachedInventory(),
      supabase.from('suppliers').select('id, name, contact, category, address, debt, status').order('created_at', { ascending: false }).limit(300),
      supabase.from('ho_so_nhan_vien').select('id, tai_khoan, ho_ten, vai_tro, khu_vuc_quan_ly'),
      supabase.from('company_info').select('name, tax_id, address, email, phone, logo_url').eq('id', 1).single(),
      supabase.from('app_settings').select('value').eq('key', 'inventory_config').single()
    ]);


    
    if (invData) {
      setInventory(invData.map((i: any) => ({
        sku: i.sku, name: i.name, spec: i.spec, storageUnit: i.storage_unit, conversionRate: Number(i.conversion_rate), stock: Number(i.stock), price: Number(i.price), retailPrice: Number(i.retail_price || 0), daysToReorder: Number(i.days_to_reorder), expDate: i.exp_date, status: i.status,
        batches: i.inventory_batches?.map((b: any) => ({ expDate: b.exp_date, qty: Number(b.qty) })) || []
      })));
    }

    if (supData) setSuppliers(supData.map((s: any) => ({ id: s.id, name: s.name, contact: s.contact, category: s.category, address: s.address, debt: Number(s.debt), status: s.status })));
    


    
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
    inventory, setInventory,
    suppliers, setSuppliers,
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

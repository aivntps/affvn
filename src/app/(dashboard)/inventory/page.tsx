"use client";

import { useState, useEffect } from "react";
import { Plus, Box, Users, X, Trash2 } from "lucide-react";

import { InventoryTab } from "./components/InventoryTab";
import { OrdersTab } from "./components/OrdersTab";
import { SuppliersTab } from "./components/SuppliersTab";
import { SettingsTab } from "./components/SettingsTab";
import { formatCurrency } from "./utils";
import { InventoryItem, Order, Supplier, GrnItem, PoItem } from "./types";

import { useGlobalData } from "@/lib/store/GlobalContext";
import { addProductAction, updateProductAction, deleteProductAction, addSupplierAction, savePurchaseOrderAction } from "./actions";

import AddProductModal from "./components/AddProductModal";
import { EditProductModal } from "./components/EditProductModal";
import { CreatePoModal } from "./components/CreatePoModal";
import { ReceiveStockModal } from "./components/ReceiveStockModal";
import { EditPoModal } from "./components/EditPoModal";
export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "orders" | "suppliers" | "settings">("inventory");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [isReceivingStock, setIsReceivingStock] = useState(false);
  const [editingPO, setEditingPO] = useState<Order | null>(null);
  const [initialPoId, setInitialPoId] = useState<string | undefined>(undefined);

  // States
  const { inventory, setInventory, suppliers, setSuppliers, receiveStockFromPO } = useGlobalData();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchPurchaseOrders = async () => {
    setOrdersLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: poData } = await supabase
      .from('purchase_orders')
      .select('id, supplier, qty, spec, price, date, status, po_items(product_id, qty, price)')
      .order('created_at', { ascending: false });
    
    if (poData) {
      setOrders(poData.map((p: any) => ({
        id: p.id, supplier: p.supplier, qty: Number(p.qty), spec: p.spec, price: Number(p.price), date: p.date, status: p.status,
        items: p.po_items?.map((pi: any) => ({ productId: pi.product_id, qty: Number(pi.qty), price: Number(pi.price) })) || []
      })));
    }
    setOrdersLoading(false);
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const handleCreatePO = async (newOrder: Order) => {
    // Optimistic UI
    setOrders([newOrder, ...orders]);
    setIsCreatingPO(false);

    // DB Sync
    const res = await savePurchaseOrderAction(newOrder);
    if (res?.error) {
      alert("Lỗi tạo PO: " + res.error);
    } else {
      fetchPurchaseOrders();
    }
  };

  const handleConfirmReceiveStock = async (finalPoId: string, grnItems: GrnItem[]) => {
    // Gửi lệnh nhập kho (Sẽ tự chuyển PO sang Đã nhập kho và cập nhật công nợ)
    await receiveStockFromPO(finalPoId, grnItems);
    setIsReceivingStock(false);
    fetchPurchaseOrders(); // Refetch orders to get updated status
  };

  const handleAddProduct = async (newProduct: InventoryItem) => {
    setInventory([newProduct, ...inventory]);
    setIsAddingProduct(false);
    const res = await addProductAction(newProduct);
    if (res?.error) alert("Lỗi thêm SP: " + res.error);
  };

  const handleEditProduct = async (updatedProduct: InventoryItem) => {
    setInventory(inventory.map(p => p.sku === updatedProduct.sku ? updatedProduct : p));
    setEditingProduct(null);
    const res = await updateProductAction(updatedProduct);
    if (res?.error) alert("Lỗi sửa SP: " + res.error);
  };

  const handleEditPo = async (updatedPo: Order) => {
    // Optimistic UI
    setOrders(orders.map(o => o.id === updatedPo.id ? updatedPo : o));
    setEditingPO(null);

    // DB Sync
    const res = await savePurchaseOrderAction(updatedPo);
    if (res?.error) {
      alert("Lỗi sửa PO: " + res.error);
    } else {
      fetchPurchaseOrders();
    }
  };


  const handleDeleteProduct = async (sku: string) => {
    const isInOrders = orders.some(o => o.items.some(i => i.productId === sku));
    if (isInOrders) {
      alert("Không thể xóa sản phẩm này vì đã phát sinh dữ liệu mua hàng (PO)!");
      return;
    }
    
    // Optimistic UI
    setInventory(inventory.filter(i => i.sku !== sku));
    setEditingProduct(null);

    // DB Sync
    const res = await deleteProductAction(sku);
    if (res?.error) alert("Lỗi xóa SP: " + res.error);
  };

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "inventory" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Tồn kho
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "orders" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Đặt hàng
          </button>
          <button 
            onClick={() => setActiveTab("suppliers")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "suppliers" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Nhà cung cấp
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "settings" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Cài đặt kho
          </button>
        </div>

        <div className="flex items-center gap-3 pb-2">
          {activeTab === "inventory" && (
            <>
              <button 
                onClick={() => setIsCreatingPO(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tạo đơn nhập hàng
              </button>
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm sản phẩm mới
              </button>
            </>
          )}
          {activeTab === "suppliers" && (
            <button 
              onClick={() => setIsAddingSupplier(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm nhà cung cấp
            </button>
          )}
          {activeTab === "orders" && (
            <>
              <button 
                onClick={() => setIsCreatingPO(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tạo đơn nhập hàng
              </button>
              <button 
                onClick={() => {
                  setInitialPoId(undefined);
                  setIsReceivingStock(true);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nhập kho mới
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === "inventory" && <InventoryTab inventory={inventory} setEditingProduct={setEditingProduct} />}
      {activeTab === "orders" && <OrdersTab orders={orders} setEditingPO={setEditingPO} setIsReceivingStock={setIsReceivingStock} setInitialPoId={setInitialPoId} />}
      {activeTab === "suppliers" && <SuppliersTab suppliers={suppliers} setIsAddingSupplier={setIsAddingSupplier} />}
      {activeTab === "settings" && <SettingsTab />}

      {/* --- Modals Section --- */}
      {isAddingProduct && (
        <AddProductModal onClose={() => setIsAddingProduct(false)} onSave={handleAddProduct} />
      )}
      
      {editingProduct && (
        <EditProductModal 
          editingProduct={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSave={handleEditProduct} 
          onDelete={handleDeleteProduct} 
        />
      )}

      {isCreatingPO && (
        <CreatePoModal 
          suppliers={suppliers} 
          inventory={inventory} 
          orderCount={orders.length} 
          onClose={() => setIsCreatingPO(false)} 
          onSave={handleCreatePO} 
        />
      )}

      {isReceivingStock && (
        <ReceiveStockModal 
          suppliers={suppliers} 
          inventory={inventory} 
          orders={orders} 
          initialPoId={initialPoId} 
          onClose={() => setIsReceivingStock(false)} 
          onSave={handleConfirmReceiveStock} 
        />
      )}

      {editingPO && (
        <EditPoModal 
          initialPO={editingPO} 
          inventory={inventory} 
          onClose={() => setEditingPO(null)} 
          onSave={handleEditPo} 
        />
      )}

      {isAddingSupplier && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col relative animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Thêm nhà cung cấp mới</h2>
              <button onClick={() => setIsAddingSupplier(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newNcc: Supplier = {
                  id: `NCC-${String(suppliers.length + 1).padStart(3, '0')}`,
                  name: formData.get('name') as string,
                  contact: formData.get('contact') as string,
                  category: formData.get('category') as string,
                  address: formData.get('address') as string,
                  debt: 0,
                  status: "Đang hợp tác"
                };

                setSuppliers([newNcc, ...suppliers]);
                setIsAddingSupplier(false);

                const res = await addSupplierAction(newNcc);
                if (res?.error) alert("Lỗi thêm NCC: " + res.error);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Tên nhà cung cấp *</label>
                    <input name="name" required placeholder="Nhập tên NCC" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Số điện thoại *</label>
                    <input name="contact" required placeholder="09xx..." className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Danh mục</label>
                    <input name="category" placeholder="Đồ uống..." className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Địa chỉ / Khu vực</label>
                    <input name="address" placeholder="TP.HCM..." className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setIsAddingSupplier(false)} className="px-6 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl font-bold">Hủy bỏ</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Lưu nhà cung cấp</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Supplier, InventoryItem, Order, GrnItem } from "../types";
import { formatCurrency } from "../utils";
import { savePurchaseOrderAction } from "../actions";

export function ReceiveStockModal({
  suppliers,
  inventory,
  orders,
  initialPoId,
  onClose,
  onSave
}: {
  suppliers: Supplier[];
  inventory: InventoryItem[];
  orders: Order[];
  initialPoId?: string;
  onClose: () => void;
  onSave: (finalPoId: string, grnItems: GrnItem[]) => Promise<void>;
}) {
  const [receiveTab, setReceiveTab] = useState<"manual" | "from_po">(initialPoId ? "from_po" : "manual");
  const [selectedPoId, setSelectedPoId] = useState(initialPoId || "");
  const [manualSupplier, setManualSupplier] = useState("");
  
  const [grnItems, setGrnItems] = useState<GrnItem[]>([
    { id: 1, productId: "", qty: 1, price: 0, expDate: "" },
  ]);

  useEffect(() => {
    if (initialPoId) {
      handleImportPO(initialPoId);
    }
  }, [initialPoId]);

  const addGrnItem = () => {
    setGrnItems([...grnItems, { id: Date.now(), productId: "", qty: 1, price: 0, expDate: "" }]);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateGrnItem = (id: number, field: keyof GrnItem, value: any) => {
    setGrnItems(grnItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeGrnItem = (id: number) => {
    if (grnItems.length > 1) {
      setGrnItems(grnItems.filter(item => item.id !== id));
    }
  };

  const totalGrnAmount = grnItems.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const handleImportPO = (poId: string) => {
    setSelectedPoId(poId);
    if (!poId) {
       setGrnItems([{ id: 1, productId: "", qty: 1, price: 0, expDate: "" }]);
       return;
    }
    const po = orders.find(o => o.id === poId);
    if (po) {
      setGrnItems(po.items.map((i, idx) => ({
        id: idx + 1,
        productId: i.productId,
        qty: i.qty,
        price: i.price,
        expDate: "" // Cần thủ kho tự điền HSD thực tế lúc nhập
      })));
    }
  };

  const handleConfirmReceiveStock = async () => {
    if (receiveTab === 'from_po' && !selectedPoId) {
      alert("Vui lòng chọn đơn hàng PO!");
      return;
    }
    if (receiveTab === 'manual' && !manualSupplier) {
      alert("Vui lòng chọn Nhà cung cấp!");
      return;
    }
    if (grnItems.some(i => !i.productId || i.qty <= 0 || !i.expDate)) {
      alert("Vui lòng điền đầy đủ và đúng thông tin (loại SP, số lượng > 0, ngày hết hạn)!");
      return;
    }

    let finalPoId = receiveTab === 'from_po' ? selectedPoId : "";

    if (receiveTab === 'manual') {
      const year = new Date().getFullYear();
      const stt = String(orders.length + 1).padStart(3, '0');
      finalPoId = `PO-${year}-${stt}`;
      
      const newOrder: Order = {
        id: finalPoId,
        supplier: manualSupplier,
        qty: grnItems.reduce((s, i) => s + i.qty, 0),
        spec: "Nhập trực tiếp",
        price: totalGrnAmount,
        date: new Date().toISOString().split('T')[0],
        status: "Hàng chờ về",
        items: grnItems.map((i, idx) => ({ id: idx, productId: i.productId, qty: i.qty, price: i.price }))
      };
      
      const resPo = await savePurchaseOrderAction(newOrder);
      if (resPo?.error) {
        alert("Lỗi tạo PO hệ thống: " + resPo.error);
        return;
      }
    }

    await onSave(finalPoId, grnItems);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-gray-900">Nhập kho sản phẩm</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="px-6 flex items-center border-b border-gray-100">
          <button onClick={() => setReceiveTab("manual")} className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${receiveTab === "manual" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Nhập mới</button>
          <button onClick={() => setReceiveTab("from_po")} className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${receiveTab === "from_po" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Theo đơn đã đặt</button>
        </div>
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {receiveTab === "manual" ? (
            <>
              <div className="mb-6 space-y-2">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider text-[11px]">Nhà cung cấp / Đối tác</label>
                <select value={manualSupplier} onChange={(e) => setManualSupplier(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Chọn nhà cung cấp nhập hàng --</option>
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
                    <tr><th className="px-4 py-3 min-w-[280px]">Sản phẩm</th><th className="px-4 py-3 min-w-[100px]">Quy cách</th><th className="px-4 py-3 w-32 text-center">SL</th><th className="px-4 py-3 w-32 text-center">Giá nhập</th><th className="px-4 py-3 w-40 text-center">Hạn SD</th><th className="px-4 py-3 w-32 text-right">Thành tiền</th><th className="px-4 py-3"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {grnItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3"><select value={item.productId} onChange={(e) => updateGrnItem(item.id, 'productId', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"><option value="">Chọn SP</option>{inventory.map(p => <option key={p.sku} value={p.sku}>{p.name}</option>)}</select></td>
                        <td className="px-4 py-3 text-gray-500 font-medium">{inventory.find(p => p.sku === item.productId)?.spec || '-'}</td>
                        <td className="px-4 py-3"><input type="number" min="1" value={item.qty} onChange={(e) => updateGrnItem(item.id, 'qty', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-center outline-none focus:ring-2 focus:ring-blue-500" /></td>
                        <td className="px-4 py-3"><input type="number" value={item.price} onChange={(e) => updateGrnItem(item.id, 'price', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-center outline-none focus:ring-2 focus:ring-blue-500" /></td>
                        <td className="px-4 py-3"><input type="date" value={item.expDate} onChange={(e) => updateGrnItem(item.id, 'expDate', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(item.qty * item.price)}</td>
                        <td className="px-4 py-3">{grnItems.length > 1 && <button onClick={() => removeGrnItem(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <button onClick={addGrnItem} className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-xl"><Plus className="w-4 h-4" /> Thêm sản phẩm</button>
                <div className="flex items-center gap-2 text-gray-500"><span className="text-sm">Tổng tiền:</span><span className="text-xl font-black text-blue-600">{formatCurrency(totalGrnAmount)}</span></div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900 uppercase">Chọn đơn hàng chờ về</label>
                <select value={selectedPoId} onChange={(e) => handleImportPO(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Chọn đơn hàng PO --</option>
                  {orders.filter(o => o.status === 'Hàng chờ về').map(o => <option key={o.id} value={o.id}>{o.id} - {o.supplier} ({o.qty} {o.spec})</option>)}
                </select>
              </div>
              {selectedPoId && (
                <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 uppercase text-[10px]">
                      <tr><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3 min-w-[100px]">Quy cách</th><th className="px-4 py-3 text-center">Số lượng</th><th className="px-4 py-3 text-center">Hạn SD</th><th className="px-4 py-3 text-right">Đơn giá</th><th className="px-4 py-3 text-right">Thành tiền</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {grnItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-gray-900">{inventory.find(p => p.sku === item.productId)?.name || item.productId}</td>
                          <td className="px-4 py-3 text-gray-500 font-medium">{inventory.find(p => p.sku === item.productId)?.spec || '-'}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.qty}</td>
                          <td className="px-4 py-3">
                            <input type="date" required value={item.expDate} onChange={(e) => updateGrnItem(item.id, 'expDate', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(item.qty * item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl font-bold">Hủy</button>
          <button 
            onClick={handleConfirmReceiveStock}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
          >
             Xác nhận nhập kho
          </button>
        </div>
      </div>
    </div>
  );
}

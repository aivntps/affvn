"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Supplier, InventoryItem, PoItem, Order } from "../types";
import { formatCurrency } from "../utils";

export function CreatePoModal({
  suppliers,
  inventory,
  onClose,
  onSave
}: {
  suppliers: Supplier[];
  inventory: InventoryItem[];
  orderCount: number;
  onClose: () => void;
  onSave: (order: Order) => Promise<void>;
}) {
  const [poSupplier, setPoSupplier] = useState(suppliers[0]?.name || "");
  const [poItems, setPoItems] = useState<PoItem[]>([
    { id: 1, productId: inventory[0]?.sku || "", qty: 10, price: inventory[0]?.price || 0 },
  ]);

  const addPoItem = () => {
    setPoItems([...poItems, { id: Date.now(), productId: inventory[0]?.sku || "", qty: 1, price: inventory[0]?.price || 0 }]);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePoItem = (id: number, field: keyof PoItem, value: any) => {
    setPoItems(poItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removePoItem = (id: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter(item => item.id !== id));
    }
  };

  const totalPoAmount = poItems.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const handleCreate = async () => {
    if (poItems.some(i => !i.productId || i.qty <= 0)) {
      alert("Vui lòng điền đầy đủ và đúng thông tin các dòng (loại SP, số lượng > 0)!");
      return;
    }

    // Tạo mô tả Quy cách thông minh
    const firstItem = poItems[0];
    const firstProduct = inventory.find(p => p.sku === firstItem.productId);
    let specSummary = firstProduct ? `${firstProduct.name} (${firstProduct.spec || 'N/A'})` : "Đơn hàng nhập";
    if (poItems.length > 1) specSummary += ` và ${poItems.length - 1} sản phẩm khác`;

    const newOrder: Order = {
      id: "NEW",
      supplier: poSupplier,
      qty: poItems.reduce((sum, item) => sum + item.qty, 0),
      spec: specSummary,
      price: totalPoAmount,
      date: new Date().toISOString().split('T')[0],
      status: "Hàng chờ về",
      items: poItems
    };

    await onSave(newOrder);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tạo đơn nhập hàng mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto">
          <div className="mb-6 space-y-2">
            <label className="text-sm font-bold text-gray-900 uppercase tracking-wider text-[11px]">Nhà cung cấp</label>
            <select value={poSupplier} onChange={(e) => setPoSupplier(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
                <tr><th className="px-4 py-3 min-w-[280px]">Sản phẩm</th><th className="px-4 py-3 min-w-[100px]">Quy cách</th><th className="px-4 py-3 w-32 text-center">Số lượng</th><th className="px-4 py-3 w-36 text-center">Giá nhập</th><th className="px-4 py-3 w-40 text-right">Thành tiền</th><th className="px-4 py-3 w-12"></th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {poItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <select value={item.productId} onChange={(e) => updatePoItem(item.id, 'productId', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        {inventory.map(p => <option key={p.sku} value={p.sku}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{inventory.find(p => p.sku === item.productId)?.spec || '-'}</td>
                    <td className="px-4 py-3"><input type="number" min="1" value={item.qty} onChange={(e) => updatePoItem(item.id, 'qty', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-center outline-none focus:ring-2 focus:ring-blue-500" /></td>
                    <td className="px-4 py-3"><input type="number" value={item.price} onChange={(e) => updatePoItem(item.id, 'price', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-right outline-none focus:ring-2 focus:ring-blue-500" /></td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(item.qty * item.price)}</td>
                    <td className="px-4 py-3 text-center"><button onClick={() => removePoItem(item.id)} disabled={poItems.length === 1} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button onClick={addPoItem} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100"><Plus className="w-4 h-4" /> Thêm sản phẩm</button>
            <div className="flex items-center gap-4 text-gray-500"><span className="text-sm">Tổng tiền nhập hàng:</span><span className="text-2xl font-black text-blue-600">{formatCurrency(totalPoAmount)}</span></div>
          </div>
        </div>
        <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors">Hủy</button>
          <button onClick={handleCreate} className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Tạo đơn hàng</button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Order, InventoryItem } from "../types";
import { formatCurrency } from "../utils";

export function EditPoModal({
  initialPO,
  inventory,
  onClose,
  onSave
}: {
  initialPO: Order;
  inventory: InventoryItem[];
  onClose: () => void;
  onSave: (updatedPO: Order) => void;
}) {
  const [editingPO, setEditingPO] = useState<Order>(initialPO);

  const handleSave = () => {
    const price = editingPO.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const qty = editingPO.items.reduce((sum, item) => sum + item.qty, 0);
    onSave({ ...editingPO, price, qty });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 font-medium text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nhà cung cấp</label>
               <input 
                 value={editingPO.supplier} 
                 onChange={(e) => setEditingPO({...editingPO, supplier: e.target.value})}
                 readOnly={editingPO.status !== 'Hàng chờ về'} 
                 className={`w-full px-4 py-2 border border-gray-200 rounded-lg outline-none font-medium text-gray-900 ${editingPO.status === 'Hàng chờ về' ? 'bg-white focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed'}`} 
               />
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày tạo đơn</label>
               <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-500">{editingPO.date}</div>
             </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 text-xs">
                 <tr><th className="px-4 py-3 min-w-[200px]">Sản phẩm</th><th className="px-4 py-3 min-w-[100px]">Quy cách</th><th className="px-4 py-3 w-28 text-center">SL</th><th className="px-4 py-3 w-36 text-center">Đơn giá</th><th className="px-4 py-3 w-40 text-right">Thành tiền</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {editingPO.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-gray-900 text-xs">
                      {editingPO.status === 'Hàng chờ về' ? (
                        <select 
                          value={item.productId} 
                          onChange={(e) => {
                            const newItems = [...editingPO.items];
                            newItems[i] = { ...item, productId: e.target.value };
                            setEditingPO({ ...editingPO, items: newItems });
                          }} 
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {inventory.map(p => <option key={p.sku} value={p.sku}>{p.name}</option>)}
                        </select>
                      ) : (
                        inventory.find(p => p.sku === item.productId)?.name || item.productId
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{inventory.find(p => p.sku === item.productId)?.spec || '-'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {editingPO.status === 'Hàng chờ về' ? (
                        <input 
                          type="number" 
                          min="1"
                          value={item.qty} 
                          onChange={(e) => {
                            const newItems = [...editingPO.items];
                            newItems[i] = { ...item, qty: parseInt(e.target.value) || 0 };
                            setEditingPO({ ...editingPO, items: newItems });
                          }}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-center outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        item.qty
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {editingPO.status === 'Hàng chờ về' ? (
                        <input 
                          type="number" 
                          value={item.price} 
                          onChange={(e) => {
                            const newItems = [...editingPO.items];
                            newItems[i] = { ...item, price: parseInt(e.target.value) || 0 };
                            setEditingPO({ ...editingPO, items: newItems });
                          }}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-center outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        formatCurrency(item.price)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(item.qty * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-8 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl font-bold">Đóng</button>
           {editingPO.status === 'Hàng chờ về' && (
             <button 
              onClick={handleSave} 
              className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold"
             >
               Lưu thay đổi
             </button>
           )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { X } from "lucide-react";
import { InventoryItem } from "../types";

export default function AddProductModal({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: (product: InventoryItem) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Thêm sản phẩm mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form className="space-y-5" id="addProductForm" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newProduct: InventoryItem = {
              sku: formData.get('sku') as string,
              name: formData.get('name') as string,
              spec: formData.get('spec') as string,
              storageUnit: formData.get('storageUnit') as string,
              conversionRate: Number(formData.get('conversionRate')),
              stock: 0,
              price: Number(formData.get('price_in')),
              retailPrice: Number(formData.get('retailPrice') || formData.get('price_in')),
              daysToReorder: 10,
              expDate: "2026-12-31",
              status: "Đang KD"
            };
            
            await onSave(newProduct);
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">SKU / Mã sản phẩm *</label>
                <input name="sku" required type="text" placeholder="VD: M-SOC-02" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tên sản phẩm *</label>
                <input name="name" required type="text" placeholder="Nhập tên" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Đơn vị lưu kho *</label>
                <input name="storageUnit" required type="text" placeholder="VD: Thùng" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Hệ số chuyển đổi *</label>
                <input name="conversionRate" required type="number" placeholder="VD: 24" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Quy cách (ĐV Cơ bản) *</label>
                <input name="spec" required type="text" placeholder="VD: Hộp 200ml" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Giá nhập dư kiến</label>
                <input name="price_in" type="number" placeholder="0" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Giá bán dư kiến</label>
                <input name="retailPrice" type="number" placeholder="0" className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm focus:ring-blue-500" />
              </div>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50">Hủy bỏ</button>
          <button type="submit" form="addProductForm" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-lg font-medium">Lưu sản phẩm</button>
        </div>
      </div>
    </div>
  );
}

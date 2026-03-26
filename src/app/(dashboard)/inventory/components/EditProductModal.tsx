"use client";

import { X, Trash2 } from "lucide-react";
import { InventoryItem } from "../types";

export function EditProductModal({
  editingProduct,
  onClose,
  onSave,
  onDelete
}: {
  editingProduct: InventoryItem;
  onClose: () => void;
  onSave: (product: InventoryItem) => Promise<void>;
  onDelete: (sku: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết / Sửa sản phẩm</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <form 
            className="space-y-5" 
            id="editProductForm" 
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              const updatedProduct = { 
                      ...editingProduct, 
                      name: formData.get('name') as string,
                      spec: formData.get('spec') as string,
                      storageUnit: formData.get('storageUnit') as string,
                      conversionRate: Number(formData.get('conversionRate')) || editingProduct.conversionRate,
                      price: Number(formData.get('price')) || editingProduct.price,
                      retailPrice: Number(formData.get('retailPrice')) || editingProduct.retailPrice || editingProduct.price,
                      status: formData.get('status') as string 
              };

              await onSave(updatedProduct);
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">SKU / Mã sản phẩm</label>
                <input value={editingProduct.sku} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tên sản phẩm *</label>
                <input name="name" required defaultValue={editingProduct.name} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Đơn vị lưu kho *</label>
                <input name="storageUnit" required defaultValue={editingProduct.storageUnit} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Hệ số chuyển đổi *</label>
                <input name="conversionRate" type="number" required defaultValue={editingProduct.conversionRate} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Quy cách (ĐV Cơ bản) *</label>
                <input name="spec" required defaultValue={editingProduct.spec} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Giá nhập *</label>
                <input name="price" type="number" required defaultValue={editingProduct.price} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Giá bán dự kiến</label>
                <input name="retailPrice" type="number" defaultValue={editingProduct.retailPrice || 0} className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Trạng thái KD *</label>
                <select name="status" defaultValue={editingProduct.status} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="Đang KD">Đang KD</option>
                  <option value="Ngừng KD">Ngừng KD</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-xl">
          <button 
            type="button"
            onClick={() => onDelete(editingProduct.sku)} 
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
           >
            <Trash2 className="w-4 h-4" />
            Xóa SP
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors">Hủy</button>
            <button type="submit" form="editProductForm" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </div>
  );
}

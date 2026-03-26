"use client";

import { X } from "lucide-react";
import { SaleOrder } from "../types";
import { useGlobalData } from "@/lib/store/GlobalContext";

export default function OrderDetailModal({
  order,
  onClose
}: {
  order: SaleOrder;
  onClose: () => void;
}) {
  const { companyInfo, inventory } = useGlobalData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
            <div className="flex items-center gap-3 mt-1 text-sm">
              <span className="text-blue-600 font-medium">{order.id}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">{order.date}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Nhân viên: <span className="font-medium text-gray-700">{order.staffName}</span></span>
              <span className="text-gray-300">|</span>
              <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{order.status}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#f8fafc]">
          
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between text-sm">
            <div className="flex gap-8">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Tên khách hàng</p>
                <p className="font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Loại khách</p>
                <p className="font-medium text-gray-900">{order.customerType}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Khu vực</p>
                <p className="font-medium text-gray-900">{order.customerRegion}</p>
              </div>
            </div>
            <div className="text-right">
                <p className="text-gray-500 text-xs mb-0.5">Tổng cộng</p>
                <p className="text-xl font-bold text-blue-700 leading-none">{formatCurrency(order.total)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 font-medium">Sản phẩm</th>
                    <th className="px-5 py-3 font-medium">Quy cách</th>
                    <th className="px-5 py-3 font-medium text-center">SL</th>
                    <th className="px-5 py-3 font-medium text-right">Đơn giá</th>
                    <th className="px-5 py-3 font-medium text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-5 py-3 text-gray-500">{inventory.find(p => p.sku === item.productId)?.spec || '-'}</td>
                      <td className="px-5 py-3 text-center text-gray-600">{item.qty}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">{formatCurrency(item.qty * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

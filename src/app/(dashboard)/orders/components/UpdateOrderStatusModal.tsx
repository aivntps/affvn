"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SaleOrder, OrderStatus } from "../types";

export default function UpdateOrderStatusModal({
  order,
  onSave,
  onClose
}: {
  order: SaleOrder;
  onSave: (id: string, newStatus: OrderStatus) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);

  // Define allowed transitions depending on current status
  let allowedOptions: OrderStatus[] = [];
  if (order.status === "Chờ duyệt") allowedOptions = ["Chờ duyệt", "Đang giao", "Đã hủy"];
  else if (order.status === "Đang giao") allowedOptions = ["Đang giao", "Chưa TT", "Đã thanh toán", "Đã hủy"];
  else if (order.status === "Chưa TT") allowedOptions = ["Chưa TT", "Đã thanh toán", "Đã hủy"];
  else if (order.status === "Đã thanh toán") allowedOptions = ["Đã thanh toán"]; 
  else if (order.status === "Đã hủy") allowedOptions = ["Đã hủy"];

  const handleSave = () => {
    onSave(order.id, status);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cập nhật trạng thái đơn hàng</h2>
            <p className="text-sm text-gray-500 mt-1">Mã đơn: <span className="font-medium text-gray-900">{order.id}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-100">
            <span className="text-sm text-gray-500">Trạng thái hiện tại:</span>
            <span className="font-bold text-gray-700">{order.status}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chuyển sang trạng thái:</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value as OrderStatus)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:ring-0 focus:border-blue-600 outline-none transition-colors cursor-pointer"
            >
              {allowedOptions.map(opt => (
                <option key={opt} value={opt}>{opt === "Đã thanh toán" ? "Đã TT" : opt}</option>
              ))}
            </select>
            
            {status === "Đang giao" && order.status === "Chờ duyệt" && (
              <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-50 p-2 rounded">* Hệ thống sẽ tự động xuất kho theo lô HSD gần nhất (FIFO).</p>
            )}
            {status === "Chưa TT" && order.status === "Đang giao" && (
              <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-50 p-2 rounded">* Hệ thống sẽ cộng dồn tổng tiền {new Intl.NumberFormat("vi-VN").format(order.total)}đ vào Công Nợ của khách hàng.</p>
            )}
            {status === "Đã thanh toán" && order.status === "Chưa TT" && (
              <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-50 p-2 rounded">* Hệ thống sẽ tự động trừ Công Nợ đã ghi nhận trước đó của khách hàng.</p>
            )}
            {status === "Đã hủy" && order.status !== "Chờ duyệt" && order.status !== "Đã hủy" && (
              <p className="text-xs text-amber-600 mt-2 font-medium bg-amber-50 p-2 rounded">* Đơn hàng bị hủy sẽ tự động hoàn trả tồn kho và công nợ (nếu đơn đang nợ) về trạng thái cũ.</p>
            )}
            {status === order.status && allowedOptions.length > 1 && (
              <p className="text-xs text-gray-500 mt-2 italic">Chọn một trạng thái khác để cập nhật.</p>
            )}
            {allowedOptions.length === 1 && (
              <p className="text-xs text-gray-500 mt-2 italic">Trạng thái cuối cùng, không thể thao tác thêm.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">
            Hủy
          </button>
          <button onClick={handleSave} disabled={status === order.status} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 shadow-sm shadow-blue-600/20">
            Cập nhật
          </button>
        </div>

      </div>
    </div>
  )
}

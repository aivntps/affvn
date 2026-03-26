"use client";

import { useState, useRef, useMemo } from "react";
import { X, Trash2 } from "lucide-react";
import { SaleOrder, SaleOrderItem } from "../types";

import { Customer, InventoryItem } from "@/lib/store/GlobalContext";

export default function CreateOrderModal({
  user,
  customers,
  products,
  orders,
  initialOrder,
  onSave,
  onClose
}: {
  user: any;
  customers: Customer[];
  products: InventoryItem[];
  orders?: SaleOrder[];
  initialOrder?: SaleOrder;
  onSave: (order: SaleOrder) => void;
  onClose: () => void;
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialOrder?.customerId || "");
  const [paymentDate, setPaymentDate] = useState(initialOrder?.paymentDate || "");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState<number | "">(1);
  const [items, setItems] = useState<SaleOrderItem[]>(initialOrder?.items || []);

  const qtyInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("vi-VN").format(amt) + " đ";
  };

  const allowedCustomers = useMemo(() => {
    if (!user || user.vai_tro === "Giám đốc" || user.khu_vuc_quan_ly === "Tất cả khu vực" || !user.khu_vuc_quan_ly) {
      return customers;
    }
    return customers.filter(c => c.region === user.khu_vuc_quan_ly);
  }, [customers, user]);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProductId(val);
    if (val) {
      setTimeout(() => {
        if (qtyInputRef.current) {
          qtyInputRef.current.focus();
          qtyInputRef.current.select();
        }
      }, 50); // slight delay to ensure DOM is ready
    }
  };

  const currentProduct = products.find(p => p.sku === selectedProductId);

  const handleAddItem = () => {
    if (!currentProduct) return;
    const finalQty = Number(qty) || 1;
    if (finalQty <= 0) return;

    const existing = items.find(i => i.productId === currentProduct.sku);
    const totalRequestQty = existing ? existing.qty + finalQty : finalQty;

    if (totalRequestQty > currentProduct.stock) {
      alert(`Xin lỗi, sản phẩm này chỉ còn ${currentProduct.stock} tồn kho.`);
      return;
    }

    if (existing) {
      setItems(items.map(i => i.productId === currentProduct.sku ? { ...i, qty: i.qty + finalQty } : i));
    } else {
      setItems([...items, {
        productId: currentProduct.sku,
        name: currentProduct.name,
        qty: finalQty,
        price: currentProduct.retailPrice || currentProduct.price
      }]);
    }

    setSelectedProductId("");
    setQty(1);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.productId !== id));
  };

  const totalAmount = items.reduce((acc, cv) => acc + cv.qty * cv.price, 0);

  const handleSave = () => {
    if (!selectedCustomerId) {
      alert("Vui lòng chọn khách hàng");
      return;
    }
    if (items.length === 0) {
      alert("Đơn hàng phải có ít nhất 1 sản phẩm");
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId)!;
    
    // Generate ID: SO-yymmdd-STT
    let newId = "";
    if (initialOrder) {
      newId = initialOrder.id;
    } else {
      const todayIso = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const yymmdd = todayIso.slice(2).replace(/-/g, ""); // YYMMDD
      let stt = 1;
      if (orders) {
        // Đếm số đơn trong ngày để tính STT
        const todayOrders = orders.filter((o: SaleOrder) => o.id.startsWith(`SO-${yymmdd}`));
        stt = todayOrders.length + 1;
      } else {
        stt = Math.floor(100 + Math.random() * 900); // Fallback
      }
      newId = `SO-${yymmdd}-${stt.toString().padStart(3, "0")}`;
    }
    
    onSave({
      id: newId,
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.type,
      customerRegion: customer.region,
      date: new Date().toISOString().split("T")[0],
      paymentDate: paymentDate || new Date().toISOString().split("T")[0],
      total: totalAmount,
      status: "Chờ duyệt",
      items,
      staffId: user?.id || "STAFF-01",
      staffName: user?.ho_ten || "Nhân viên Sale"
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
      <div className="bg-[#f8fafc] rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 rounded-t-2xl">
          <h2 className="text-xl font-bold text-blue-700">{initialOrder ? "Cập nhật đơn hàng" : "Tạo đơn hàng mới"}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Box 1: Thông tin chung */}
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng <span className="text-red-500">*</span></label>
                <select 
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" disabled>Chọn khách hàng...</option>
                  {allowedCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - ({c.type})</option>
                  ))}
                </select>
                {allowedCustomers.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Không có khách hàng nào trong khu vực của bạn.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thanh toán dự kiến</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 cursor-pointer" 
                />
              </div>
            </div>

            {/* Box 2: Thêm sản phẩm */}
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm</label>
                <select 
                  value={selectedProductId}
                  onChange={handleProductChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" disabled>Chọn sản phẩm từ kho...</option>
                  {products.map(p => (
                    <option key={p.sku} value={p.sku}>
                      {p.name} (Tồn: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                 <div className="flex gap-3">
                   <input 
                     type="number" 
                     min="1"
                     ref={qtyInputRef}
                     value={qty}
                     onChange={e => setQty(e.target.value ? Number(e.target.value) : "")}
                     onKeyDown={e => {
                       if (e.key === "Enter") {
                         e.preventDefault();
                         handleAddItem();
                       }
                     }}
                     className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                   />
                   <button 
                     onClick={handleAddItem}
                     disabled={!selectedProductId}
                     className="px-6 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Thêm
                   </button>
                 </div>
              </div>
            </div>

          </div>

          {/* Box 3: Chi tiết đơn hàng */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
              <h3 className="font-bold text-gray-800 text-base">Chi tiết đơn hàng</h3>
              <div>
                <span className="text-sm text-gray-500 mr-2">Tổng cộng:</span>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 rounded-l-lg font-medium">Sản phẩm</th>
                    <th className="px-4 py-2.5 font-medium">Quy cách</th>
                    <th className="px-4 py-2.5 font-medium text-center">SL</th>
                    <th className="px-4 py-2.5 font-medium text-right">Đơn giá</th>
                    <th className="px-4 py-2.5 font-medium text-right">Thành tiền</th>
                    <th className="px-4 py-2.5 rounded-r-lg font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 italic">Chưa có sản phẩm nào được chọn</td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-gray-500">{products.find(p => p.sku === item.productId)?.spec || '-'}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.qty}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">{formatCurrency(item.qty * item.price)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleRemoveItem(item.productId)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-white border-t border-gray-100 rounded-b-2xl gap-3">
          <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors">
            Hủy
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-600/20">
            {initialOrder ? "Cập nhật đơn hàng" : "Hoàn tất tạo đơn"}
          </button>
        </div>

      </div>
    </div>
  )
}

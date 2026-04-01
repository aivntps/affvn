"use client";

import { useState, useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { SaleOrder, SaleOrderItem } from "../types";

import { Customer, InventoryItem } from "@/lib/store/GlobalContext";

export default function CreateOrderModal({
  user,
  products,
  initialOrder,
  onSave,
  onClose
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  products: InventoryItem[];
  initialOrder?: SaleOrder;
  onSave: (order: SaleOrder) => void;
  onClose: () => void;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    initialOrder
      ? {
          id: initialOrder.customerId,
          name: initialOrder.customerName,
          phone: "",
          region: initialOrder.customerRegion,
          type: initialOrder.customerType,
          status: "Hoạt động",
          sales: 0
        }
      : null
  );
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [suggestedCustomers, setSuggestedCustomers] = useState<Customer[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Dùng containerRef bọc CẢ input và dropdown để click vào input không đè đóng dropdown
  const containerRef = useRef<HTMLDivElement>(null);

  // Logic click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = async (keyword: string) => {
    setIsSearchingCustomer(true);
    setSearchError(null);
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    // SỬ DỤNG RPC TRIỆT ĐỂ: Hỗ trợ tìm kiếm tiếng Việt không dấu (unaccent) và lọc status Đang giao dịch từ Database
    const { data, error } = await supabase.rpc('search_customers_v3', {
      p_keyword: keyword.trim(),
      p_region: (user && user.vai_tro !== "Giám đốc" && user.khu_vuc_quan_ly !== "Tất cả khu vực") 
                ? user.khu_vuc_quan_ly 
                : null
    });
    
    if (error) {
      console.error("Search RPC error:", error);
      setSearchError(error.message);
      setSuggestedCustomers([]);
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSuggestedCustomers(data.map((c: any) => ({ ...c, sales: Number(c.sales) })));
      setSearchError(null);
    }
    setIsSearchingCustomer(false);
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerSearchTerm(val);
    setShowCustomerDropdown(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchCustomers(val);
    }, 200); // 200ms debounce cho phản hồi tức thì
  };

  const handleCustomerFocus = () => {
    setShowCustomerDropdown(true);
    if (suggestedCustomers.length === 0) {
      fetchCustomers(""); // Load top 10 on click
    }
  };
  const [paymentDate, setPaymentDate] = useState(initialOrder?.paymentDate || "");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState<number | "">(1);
  const [items, setItems] = useState<SaleOrderItem[]>(initialOrder?.items || []);

  const qtyInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("vi-VN").format(amt) + " đ";
  };

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
    if (!selectedCustomer) {
      alert("Vui lòng chọn khách hàng");
      return;
    }
    if (items.length === 0) {
      alert("Đơn hàng phải có ít nhất 1 sản phẩm");
      return;
    }
    
    // Generate ID: SO-yymmdd-STT
    let newId = "NEW";
    if (initialOrder) {
      newId = initialOrder.id;
    }
    
    onSave({
      id: newId,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerType: selectedCustomer.type,
      customerRegion: selectedCustomer.region,
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
              <div className="relative" ref={containerRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng <span className="text-red-500">*</span></label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between w-full px-4 py-2 border border-blue-200 bg-blue-50/50 rounded-lg text-sm">
                    <div>
                      <div className="font-bold text-gray-900">{selectedCustomer.name}</div>
                      <div className="text-xs text-gray-500">{selectedCustomer.id} - {selectedCustomer.region} ({selectedCustomer.type})</div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearchTerm("");
                        setTimeout(() => fetchCustomers(""), 100);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="text"
                      placeholder="Tìm SDT, Tên Khách Hàng..."
                      value={customerSearchTerm}
                      onChange={handleCustomerSearchChange}
                      onFocus={handleCustomerFocus}
                      autoFocus
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    />
                    {showCustomerDropdown && (
                      <div 
                        className="absolute z-[110] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        {searchError ? (
                          <div className="p-3 text-center text-sm text-red-500">Lỗi kết nối: {searchError}</div>
                        ) : isSearchingCustomer ? (
                          <div className="p-3 text-center text-sm text-gray-500">Đang tìm kiếm...</div>
                        ) : suggestedCustomers.length > 0 ? (
                          <ul className="divide-y divide-gray-100">
                            {suggestedCustomers.map(c => (
                              <li 
                                key={c.id} 
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setShowCustomerDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                              >
                                <div className="font-bold text-gray-900">{c.name}</div>
                                <div className="text-xs text-gray-500 flex gap-2"><span>{c.phone}</span><span>•</span><span>{c.region}</span></div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-3 text-center text-sm text-gray-500">Không tìm thấy khách hàng nào.</div>
                        )}
                      </div>
                    )}
                  </>
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

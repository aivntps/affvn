"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Printer } from "lucide-react";
import { useUser } from "@/components/layout/ClientLayout";
import { SaleOrder, OrderStatus } from "./types";
import CreateOrderModal from "./components/CreateOrderModal";
import OrderDetailModal from "./components/OrderDetailModal";
import UpdateOrderStatusModal from "./components/UpdateOrderStatusModal";
import OrderPrintModal from "./components/OrderPrintModal";
import SalesStatisticsTab from "./components/SalesStatisticsTab";

import { useGlobalData } from "@/lib/store/GlobalContext";
import { saveSaleOrderAction } from "../inventory/actions";
export default function OrdersPage() {
  const user = useUser();
  const isAdmin = user ? (user.vai_tro === "Giám đốc") : true;

  const { inventory, updateSaleOrderStatus } = useGlobalData();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả trạng thái");
  const [dateStr, setDateStr] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "stats">("list");

  // Modals state
  const [isCreating, setIsCreating] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SaleOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<SaleOrder | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<SaleOrder | null>(null);
  const [printingOrder, setPrintingOrder] = useState<SaleOrder | null>(null);

  const [localOrders, setLocalOrders] = useState<SaleOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [_loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const fetchOrders = async () => {
    setLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    let selectQuery = 'id, customer_id, customer_name, date, payment_date, total, status, staff_id, staff_name, customers(type, region, phone), sale_order_items(product_id, qty, price, inventory(name))';
    if (!isAdmin && user?.khu_vuc_quan_ly) selectQuery = 'id, customer_id, customer_name, date, payment_date, total, status, staff_id, staff_name, customers!inner(type, region, phone), sale_order_items(product_id, qty, price, inventory(name))';

    let query = supabase.from('sale_orders').select(selectQuery, { count: 'exact' });

    if (!isAdmin && user?.khu_vuc_quan_ly) {
      query = query.eq('customers.region', user.khu_vuc_quan_ly);
    }
    if (searchTerm) {
      query = query.or(`id.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
    }
    if (filterStatus !== "Tất cả trạng thái") {
      query = query.eq('status', filterStatus);
    }
    if (dateStr) {
      query = query.eq('date', dateStr);
    }

    query = query.range((page - 1) * pageSize, page * pageSize - 1).order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (data && !error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedData: SaleOrder[] = data.map((s: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: s.id, customerId: s.customer_id, customerName: s.customer_name, customerType: s.customers?.type || 'N/A', customerRegion: s.customers?.region || 'N/A', customerPhone: s.customers?.phone || 'N/A', date: s.date, paymentDate: s.payment_date, total: Number(s.total), status: s.status as any, staffId: s.staff_id, staffName: s.staff_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (s.sale_order_items || []).map((i: any) => ({
          productId: i.product_id, productName: i.inventory?.name || 'Sản phẩm không xác định', quantity: i.qty, price: i.price,
        }))
      }));
      setLocalOrders(formattedData);
      if (count !== null) setTotalOrders(count);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [page, searchTerm, filterStatus, dateStr, user, isAdmin]);

  const filteredOrders = localOrders;
  const totalPages = Math.ceil(totalOrders / pageSize) || 1;

  const handleSaveOrder = async (newOrder: SaleOrder) => {
    setIsCreating(false);
    setEditingOrder(null);

    const res = await saveSaleOrderAction(newOrder);
    if (res?.error) {
      alert("Lỗi lưu đơn hàng: " + res.error);
    } else {
      fetchOrders(); // Refetch the precise local data after save
    }
  };

  const handleChangeStatus = (orderId: string, newStatus: OrderStatus) => {
    updateSaleOrderStatus(orderId, newStatus);
    
    // Update local immediately for responsive UI
    setLocalOrders(localOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setUpdatingOrder(null);
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("vi-VN").format(amt) + " đ";
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setActiveTab("list")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "list" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Đơn hàng
          </button>
          <button 
            onClick={() => setActiveTab("stats")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "stats" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Thống kê doanh số
          </button>
        </div>

        <div className="pb-2">
          {activeTab === "list" && (
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo đơn hàng
            </button>
          )}
        </div>
      </div>

      {activeTab === "stats" ? (
        <SalesStatisticsTab />
      ) : (
        <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm mã đơn, tên khách hàng..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="Tất cả trạng thái">Tất cả trạng thái</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Đang giao">Đang giao</option>
              <option value="Chưa TT">Chưa TT</option>
              <option value="Đã thanh toán">Đã TT</option>
              <option value="Đã hủy">Đã hủy</option>
            </select>
          </div>
          <div className="relative">
            <input 
              type="date" 
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 cursor-pointer" 
            />
          </div>
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto h-full relative">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Ngày đặt</th>
                <th className="px-6 py-4 text-right">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">Không tìm thấy đơn hàng nào</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td 
                      className="px-6 py-4 font-bold text-blue-600 hover:underline cursor-pointer"
                      onClick={() => setViewingOrder(order)}
                    >
                      {order.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{order.customerName}</td>
                    <td className="px-6 py-4 text-gray-500">{order.staffName}</td>
                    <td className="px-6 py-4 text-gray-500">{order.date}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 text-right">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={isAdmin ? () => setUpdatingOrder(order) : undefined}
                          className={`font-semibold uppercase tracking-wider text-[11px] px-2.5 py-1 rounded-full border ${isAdmin ? "cursor-pointer hover:opacity-80 " : ""}${
                          order.status === 'Chờ duyệt' ? 'bg-gray-50 text-gray-600 border-gray-200' : 
                          order.status === 'Đang giao' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          order.status === 'Chưa TT' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          order.status === 'Đã thanh toán' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
                        }`}>
                          {order.status === 'Đã thanh toán' ? 'Đã TT' : order.status}
                        </span>
                        
                        {/* Quick action buttons next to status text (only for admin) */}
                        {isAdmin && order.status === "Chờ duyệt" && (
                          <button 
                            onClick={e => { e.stopPropagation(); handleChangeStatus(order.id, "Đang giao") }}
                            title="Xác nhận giao hàng ngay"
                            className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-80 hover:opacity-100 transition-opacity"
                          >
                            Giao hàng
                          </button>
                        )}
                        {isAdmin && order.status === "Đang giao" && (
                          <button 
                            onClick={e => { e.stopPropagation(); handleChangeStatus(order.id, "Chưa TT") }}
                            title="Xác nhận khách nợ"
                            className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-80 hover:opacity-100 transition-opacity"
                          >
                            Chưa TT
                          </button>
                        )}
                        {isAdmin && order.status === "Chưa TT" && (
                          <button 
                            onClick={e => { e.stopPropagation(); handleChangeStatus(order.id, "Đã thanh toán") }}
                            title="Xác nhận đã thu tiền"
                            className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-80 hover:opacity-100 transition-opacity"
                          >
                            Đã TT
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        {order.status === "Chờ duyệt" ? (
                          <button 
                            onClick={() => setEditingOrder(order)} 
                            className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" 
                            title="Sửa thông tin đơn hàng"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        ) : null}
                        <button onClick={() => setPrintingOrder(order)} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer" title="In đơn hàng">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination UI */}
        <div className="py-3 px-6 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
          <span className="text-gray-500">
            Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalOrders)} / {totalOrders} đơn hàng
          </span>
          <div className="flex items-center gap-1">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = page;
              if (page < 3) p = i + 1;
              else if (page > totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              if (p > 0 && p <= totalPages) {
                return (
                  <button 
                    key={p} 
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border font-medium ${page === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                );
              }
              return null;
            })}
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {(isCreating || editingOrder) && (
        <CreateOrderModal 
          user={user}
          products={inventory}
          initialOrder={editingOrder || undefined}
          onSave={handleSaveOrder}
          onClose={() => {
            setIsCreating(false);
            setEditingOrder(null);
          }}
        />
      )}

      {viewingOrder && (
        <OrderDetailModal 
          order={viewingOrder} 
          onClose={() => setViewingOrder(null)} 
        />
      )}

      {updatingOrder && (
        <UpdateOrderStatusModal 
          order={updatingOrder}
          onSave={handleChangeStatus}
          onClose={() => setUpdatingOrder(null)}
        />
      )}

      {printingOrder && (
        <OrderPrintModal 
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}
      </>
      )}

    </div>
  );
}

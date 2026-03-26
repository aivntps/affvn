"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Filter, Edit, Printer, Info, Truck, CheckCircle2, List, BarChart3 } from "lucide-react";
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

  const { saleOrders: orders, setSaleOrders: setOrders, customers: globalCustomers, inventory, updateSaleOrderStatus } = useGlobalData();

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

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Logic phân quyền: staff chỉ thấy đơn của khách hàng thuộc khu vực của mình
      const hasAccess = isAdmin || !user?.khu_vuc_quan_ly || o.customerRegion === user?.khu_vuc_quan_ly;
      if (!hasAccess) return false;

      const matchSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "Tất cả trạng thái" || o.status === filterStatus;
      const matchDate = !dateStr || o.date === dateStr;

      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, searchTerm, filterStatus, dateStr, user, isAdmin]);

  const handleSaveOrder = async (newOrder: SaleOrder) => {
    const exists = orders.find(o => o.id === newOrder.id);
    if (exists) {
      setOrders(orders.map(o => o.id === newOrder.id ? newOrder : o));
    } else {
      setOrders([newOrder, ...orders]);
    }
    setIsCreating(false);
    setEditingOrder(null);

    const res = await saveSaleOrderAction(newOrder);
    if (res?.error) {
      alert("Lỗi lưu đơn hàng: " + res.error);
    }
  };

  const handleChangeStatus = (orderId: string, newStatus: OrderStatus) => {
    updateSaleOrderStatus(orderId, newStatus);
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
              <option value="Đã thanh toán">Đã thanh toán</option>
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
                          {order.status}
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
      </div>

      {(isCreating || editingOrder) && (
        <CreateOrderModal 
          user={user}
          customers={globalCustomers}
          products={inventory}
          orders={orders}
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

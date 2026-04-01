"use client";

import { DollarSign, FileText, AlertTriangle, CreditCard, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {

  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    newOrdersToday: 0,
    totalDebt: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expiringBatches: [] as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentOrders: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (data && !error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStats(data as any);
      }
      setLoading(false);
    }
    fetchStats();
  }, [supabase]);

  const { totalRevenue, newOrdersToday, expiringBatches, totalDebt, recentOrders } = stats;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("vi-VN").format(amt) + " đ";
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-400">Đang tải dữ liệu tổng quan...</div>;
  }

  return (
    <div className="flex flex-col space-y-8 h-full">
      {/* Overview Section */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Card */}
          <div className="bg-blue-600 rounded-xl p-5 text-white shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium opacity-90">Tổng doanh thu (Tháng)</span>
              <DollarSign className="w-5 h-5 opacity-80" />
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">{formatCurrency(totalRevenue)}</div>
              <div className="text-xs opacity-80">Trong tháng {currentMonth + 1}/{currentYear}</div>
            </div>
          </div>

          {/* New Orders Card */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Đơn hàng mới</span>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{newOrdersToday}</div>
              <div className="text-xs text-gray-500">Đơn đã lên trong hôm nay</div>
            </div>
          </div>

          {/* Expiring Soon Card */}
          <div 
            className="bg-white hover:bg-orange-50 transition-colors cursor-pointer rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between h-32"
            onClick={() => setShowExpiringModal(true)}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Hàng sắp hết hạn</span>
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{expiringBatches.length} <span className="text-lg font-medium text-gray-500">lô</span></div>
              <div className="text-xs text-orange-500">Cần xử lý trong 30 ngày tới</div>
            </div>
          </div>

          {/* Debt Card */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Công nợ hiện tại</span>
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalDebt)}</div>
              <div className="text-xs text-gray-500">Tổng tiền nợ (Đại lý/Nhà cung cấp)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Orders Section */}
      <section className="flex-1">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Đơn hàng gần nhất</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-gray-500 bg-white">
                <tr>
                  <th className="px-6 py-4 font-medium border-b border-gray-100">Mã ĐH</th>
                  <th className="px-6 py-4 font-medium border-b border-gray-100">Khách hàng</th>
                  <th className="px-6 py-4 font-medium border-b border-gray-100">Tổng tiền</th>
                  <th className="px-6 py-4 font-medium border-b border-gray-100">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">Không có đơn hàng nào</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-blue-600">{order.id}</td>
                      <td className="px-6 py-4 text-gray-700">{order.customerName}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          order.status === 'Chờ duyệt' ? 'bg-gray-50 text-gray-600 border-gray-200' : 
                          order.status === 'Đang giao' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          order.status === 'Chưa TT' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          order.status === 'Đã thanh toán' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal Hàng Sắp Hết Hạn */}
      {showExpiringModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-orange-500 w-6 h-6" />
                Sản phẩm sắp hết hạn (30 ngày tới)
              </h3>
              <button onClick={() => setShowExpiringModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto border border-gray-100 rounded-lg">
              {expiringBatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tuyệt vời! Không có lô hàng nào sắp hết hạn.
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium border-b">Tên sản phẩm</th>
                      <th className="px-4 py-3 font-medium border-b">Mã SKU</th>
                      <th className="px-4 py-3 font-medium border-b text-center">Mã Lô (Batch)</th>
                      <th className="px-4 py-3 font-medium border-b text-center">Ngày hết hạn</th>
                      <th className="px-4 py-3 font-medium border-b text-right">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiringBatches.map((item, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                        <td className="px-4 py-3 truncate max-w-[250px]" title={item.name}>{item.name}</td>
                        <td className="px-4 py-3 text-gray-500 font-medium">{item.sku}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.batchId}</td>
                        <td className="px-4 py-3 text-center text-orange-600 font-medium">{item.expDate}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowExpiringModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

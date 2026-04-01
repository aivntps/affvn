"use client";

import { useState, useMemo, useEffect } from "react";
import { useGlobalData } from "@/lib/store/GlobalContext";
import { useUser } from "@/components/layout/ClientLayout";
import { formatCurrency } from "@/app/(dashboard)/inventory/utils";
import { Filter, Calendar, MapPin, User as UserIcon, TrendingUp, ShoppingCart } from "lucide-react";

export default function SalesStatisticsTab() {
  const { staffList } = useGlobalData();
  const user = useUser();
  const isAdmin = user?.vai_tro === "Giám đốc";

  // Mặc định tháng này
  const currentMonth = new Date().toISOString().slice(0, 7);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [dateMonth, setDateMonth] = useState(currentMonth);
  const [staffIdFilter, setStaffIdFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("Tất cả khu vực");
  const [status, setStatus] = useState("Tất cả trạng thái");

  const regions = ["Tất cả khu vực", "Thành phố Hồ Chí Minh", "Bình Dương", "Miền Nam", "Miền Bắc"];
  const statuses = ["Tất cả trạng thái", "Chờ duyệt", "Đang giao", "Chưa TT", "Đã thanh toán", "Đã hủy"];

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      setLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      // Calculate start and end date for the selected month
      const start = `${dateMonth}-01`;
      const dateEnd = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0); // Last day of month
      const end = dateEnd.toISOString().slice(0, 10);

      const { data } = await supabase.rpc('get_sales_aggregate_by_month', {
        p_start_date: start,
        p_end_date: end
      });

      if (active && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAggregatedData(data.map((d: any) => ({
          staffId: d.staff_id,
          staffName: d.staff_name,
          customerRegion: d.customer_region,
          status: d.status,
          orderCount: Number(d.order_count),
          totalRevenue: Number(d.total_revenue)
        })));
      }
      if (active) setLoading(false);
    };
    if (dateMonth) loadOrders();
    return () => { active = false; };
  }, [dateMonth]);

  const filteredData = useMemo(() => {
    return aggregatedData.filter(row => {
      // 1. Phân quyền bắt buộc
      if (!isAdmin) {
        if (user?.khu_vuc_quan_ly && row.customerRegion !== user.khu_vuc_quan_ly) return false;
        if (user && row.staffName !== user.ho_ten && row.staffId !== user.id) return false;
      }

      // 2. Bộ lọc Nhân viên
      if (isAdmin && staffIdFilter !== "all" && row.staffId !== staffIdFilter) return false;

      // 3. Bộ lọc Khu vực
      if (isAdmin && regionFilter !== "Tất cả khu vực" && row.customerRegion !== regionFilter) return false;

      // 4. Bộ lọc Trạng thái
      if (status !== "Tất cả trạng thái" && row.status !== status) return false;

      return true;
    });
  }, [aggregatedData, staffIdFilter, regionFilter, status, isAdmin, user]);

  const totalSales = useMemo(() => {
    return filteredData
      .filter(row => row.status === "Chưa TT" || row.status === "Đã thanh toán")
      .reduce((sum, row) => sum + row.totalRevenue, 0);
  }, [filteredData]);

  const totalOrders = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + row.orderCount, 0);
  }, [filteredData]);

  const salesByStaff = useMemo(() => {
    const map: Record<string, { staffName: string, total: number, count: number }> = {};
    filteredData.forEach(row => {
      if (!map[row.staffId]) {
        map[row.staffId] = { staffName: row.staffName, total: 0, count: 0 };
      }
      
      if (row.status === "Chưa TT" || row.status === "Đã thanh toán") {
        map[row.staffId].total += row.totalRevenue;
      }
      map[row.staffId].count += row.orderCount;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-300">
      
      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Thời gian */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Thời gian</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="month" 
              value={dateMonth}
              onChange={e => setDateMonth(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Nhân viên */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Nhân viên</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={isAdmin ? staffIdFilter : (user?.id || "all")}
              onChange={e => setStaffIdFilter(e.target.value)}
              disabled={!isAdmin} // Không phải admin thì không được đổi nhân viên (chỉ xem mình)
              className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none appearance-none transition-all ${!isAdmin ? 'bg-gray-100 border-gray-100 text-gray-500' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 cursor-pointer'}`}
            >
              {isAdmin && <option value="all">Tất cả nhân viên</option>}
              {!isAdmin && <option value={user?.id || "all"}>{user?.ho_ten || "Không rõ"}</option>}
              {isAdmin && staffList.map(s => (
                <option key={s.id} value={s.id}>{s.ho_ten}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Khu vực */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Khu vực</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={isAdmin ? regionFilter : (user?.khu_vuc_quan_ly || "Tất cả khu vực")}
              onChange={e => setRegionFilter(e.target.value)}
              disabled={!isAdmin} // Nhân viên sale chỉ định cứng vùng
              className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none appearance-none transition-all ${!isAdmin ? 'bg-gray-100 border-gray-100 text-gray-500' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 cursor-pointer'}`}
            >
              {!isAdmin && <option value={user?.khu_vuc_quan_ly}>{user?.khu_vuc_quan_ly}</option>}
              {isAdmin && regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Trạng thái */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Trạng thái</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {loading && (
        <div className="flex justify-center p-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg border border-blue-500 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <TrendingUp className="w-24 h-24" />
          </div>
          <p className="text-blue-100 font-medium mb-1 relative z-10">Tổng doanh số</p>
          <h3 className="text-4xl font-bold relative z-10">{formatCurrency(totalSales)}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <p className="text-gray-500 font-medium">Số lượng đơn hàng</p>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{totalOrders} <span className="text-sm font-normal text-gray-400">đơn</span></h3>
        </div>
      </div>

      {/* Chi tiết Nhân viên */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Chi tiết theo Nhân viên</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Nhân viên</th>
                <th className="px-6 py-3 font-medium text-center">Số đơn hàng</th>
                <th className="px-6 py-3 font-medium text-right">Doanh số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salesByStaff.map((staff, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {staff.staffName.charAt(0)}
                    </div>
                    {staff.staffName}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-700">{staff.count}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">{formatCurrency(staff.total)}</td>
                </tr>
              ))}
              {salesByStaff.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">
                    Không có số liệu nào trong bộ lọc này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

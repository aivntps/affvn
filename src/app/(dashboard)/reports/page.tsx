"use client";

import { useState } from "react";
import { Filter, Calendar, TrendingUp, Package, Users, DollarSign } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from "recharts";

import { useGlobalData } from "@/lib/store/GlobalContext";
import { useMemo } from "react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const formatCurrency = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + " đ";
const formatMillions = (value: number) => value + "M";

export default function ReportsPage() {
  const { saleOrders, inventory } = useGlobalData();
  const [reportPeriod, setReportPeriod] = useState("Năm 2026");

  const {
    totalRevenue,
    totalOrders,
    uniqueCustomers,
    totalItemsSold,
    MONTHLY_REVENUE,
    PRODUCT_SHARE,
    TOP_AGENTS,
    BEST_SELLERS
  } = useMemo(() => {
    const yearMatch = reportPeriod.match(/20\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

    const qMatch = reportPeriod.match(/Quý (\d)/);
    const quarter = qMatch ? parseInt(qMatch[1]) : null;

    // Lọc đơn hàng hợp lệ
    const validOrders = saleOrders.filter(o => {
      if (o.status === "Đã hủy" || o.status === "Chờ duyệt") return false;
      const d = new Date(o.date);
      if (d.getFullYear() !== year) return false;
      if (quarter) {
        const q = Math.floor(d.getMonth() / 3) + 1;
        if (q !== quarter) return false;
      }
      return true;
    });

    // 1. Tổng quan
    const totalRev = validOrders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = validOrders.length;
    const uniqCust = new Set(validOrders.map(o => o.customerId)).size;
    const itemsSold = validOrders.reduce((acc, o) => acc + o.items.reduce((sum, item) => sum + item.qty, 0), 0);

    // 2. Biểu đồ mảng doanh thu theo tháng (Chỉ update nếu filter năm)
    const monthlyRevMap = Array(12).fill(0);
    validOrders.forEach(o => {
      const d = new Date(o.date);
      monthlyRevMap[d.getMonth()] += o.total / 1000000; // Triệu VNĐ
    });
    const monthly = monthlyRevMap.map((sum, i) => ({ name: `T${i + 1}`, sum: Math.round(sum * 10) / 10 }));

    // 3. Tỷ trọng ngành hàng
    const getCategory = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes("sữa")) return "Sữa";
      if (lower.includes("trái cây") || lower.includes("nước ép")) return "Nước trái cây";
      if (lower.includes("nước")) return "Nước giải khát";
      if (lower.includes("bia")) return "Bia";
      return "Khác";
    };
    const categoryRev: Record<string, number> = {};
    validOrders.forEach(o => {
      o.items.forEach(item => {
        const invItem = inventory.find(p => p.sku === item.productId);
        const cat = invItem ? getCategory(invItem.name) : "Khác";
        categoryRev[cat] = (categoryRev[cat] || 0) + (item.qty * item.price);
      });
    });
    const share = Object.entries(categoryRev)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Hiển thị top 5 danh mục

    // 4. Top đại lý
    const agentRev: Record<string, number> = {};
    validOrders.forEach(o => {
      if (o.customerName) {
        agentRev[o.customerName] = (agentRev[o.customerName] || 0) + o.total;
      }
    });
    const topAgents = Object.entries(agentRev)
      .map(([name, sum]) => ({ name, sales: Math.round(sum / 1000000) })) // Triệu VNĐ
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // 5. Sản phẩm bán chạy
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    validOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        }
        productSales[item.productId].qty += item.qty;
        productSales[item.productId].revenue += (item.qty * item.price);
      });
    });
    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item, i) => ({ id: i + 1, ...item }));

    return {
      totalRevenue: totalRev,
      totalOrders: orderCount,
      uniqueCustomers: uniqCust,
      totalItemsSold: itemsSold,
      MONTHLY_REVENUE: monthly,
      PRODUCT_SHARE: share.length > 0 ? share : [{ name: "Chưa có dl", value: 1 }],
      TOP_AGENTS: topAgents,
      BEST_SELLERS: bestSellers
    };
  }, [saleOrders, inventory, reportPeriod]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Báo cáo & Phân tích</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan tình hình kinh doanh, doanh số và tồn kho.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer shadow-sm"
            >
              <option>Năm 2026</option>
              <option>Quý 1 / 2026</option>
              <option>Quý 2 / 2026</option>
              <option>Quý 3 / 2026</option>
              <option>Quý 4 / 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Tổng doanh thu", value: formatCurrency(totalRevenue), increase: "Doanh thu trọn kỳ", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
          { title: "Đơn hàng thành công", value: new Intl.NumberFormat("vi-VN").format(totalOrders), increase: "Đơn đã duyệt/giao", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "KH có phát sinh đơn", value: new Intl.NumberFormat("vi-VN").format(uniqueCustomers), increase: "Tương tác trong kỳ", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Sản phẩm bán ra", value: new Intl.NumberFormat("vi-VN").format(totalItemsSold), increase: "Tổng SL hàng hóa", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <span className="text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full">{card.increase}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-gray-600 font-bold text-sm truncate">{card.title}</h3>
              <p className="text-xl font-black text-gray-900 whitespace-nowrap">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-96">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Doanh thu theo tháng ({reportPeriod})</h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={formatMillions} />
                <RechartsTooltip 
                  cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(value: any) => [`${value} Triệu VNĐ`, 'Doanh thu']}
                />
                <Line type="monotone" dataKey="sum" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, stroke: '#1d4ed8', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar & Pie Charts Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-96">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tỷ trọng doanh số ngành hàng</h3>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PRODUCT_SHARE}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {PRODUCT_SHARE.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                     formatter={(value: any) => [`${value}%`, 'Tỷ trọng']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#4B5563' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-96">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Top 5 Đại lý xuất sắc</h3>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TOP_AGENTS} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4B5563', fontWeight: 500 }} width={85} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    formatter={(value: any) => [`${value} Triệu VNĐ`, 'Doanh số']}
                  />
                  <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Best Sellers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Top Sản phẩm Bán chạy (Best-sellers)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-16 text-center">#</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4 text-center">Số lượng bán ra</th>
                <th className="px-6 py-4 text-right">Doanh thu mang lại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {BEST_SELLERS.length === 0 ? (
                 <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu cho kỳ báo cáo này</td></tr>
              ) : (
                BEST_SELLERS.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-200 text-gray-700' :
                        i === 2 ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">{new Intl.NumberFormat("vi-VN").format(item.qty)}</td>
                    <td className="px-6 py-4 text-right font-black text-green-600">{formatCurrency(item.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

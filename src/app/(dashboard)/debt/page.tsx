"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, CreditCard, AlertCircle, TrendingUp, DollarSign, X } from 'lucide-react';
import { formatCurrency } from '../inventory/utils';

import { useGlobalData } from "@/lib/store/GlobalContext";

export default function DebtManagementPage() {
  const [activeTab, setActiveTab] = useState<"phai_thu" | "phai_tra">("phai_thu");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [remindEntity, setRemindEntity] = useState<any>(null);

  const { suppliers } = useGlobalData();

  const [phaiThuList, setPhaiThuList] = useState<any[]>([]);
  const [detailInvoices, setDetailInvoices] = useState<any[]>([]);
  const [overdueDebt, setOverdueDebt] = useState(0);

  // Tính toán các con số tổng quan
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [collectedThisMonth, setCollectedThisMonth] = useState(0);
  const [paidThisMonth, setPaidThisMonth] = useState(0);

  useEffect(() => {
    let active = true;
    const loadMonthlyData = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const start = new Date(currentYear, currentMonth, 1).toLocaleDateString("en-CA"); // YYYY-MM-DD
      const end = new Date(currentYear, currentMonth + 1, 0).toLocaleDateString("en-CA");
      
      const { data, error } = await supabase.rpc('get_company_financials_by_month', {
        p_start_date: start,
        p_end_date: end
      });
      
      if (active && data && data.length > 0) {
        setCollectedThisMonth(Number(data[0].total_collected) || 0);
        setPaidThisMonth(Number(data[0].total_paid) || 0);
      }
    };
    loadMonthlyData();
    return () => { active = false; };
  }, [currentMonth, currentYear]);

  useEffect(() => {
    let active = true;
    const fetchPhaiThu = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.rpc('get_customer_debts_summary');
      if (active && data) {
        setPhaiThuList(data);
        const overdue = data.filter((d: any) => d.status === 'Quá hạn').reduce((sum: number, d: any) => sum + d.total_debt, 0);
        setOverdueDebt(overdue);
      }
    };
    fetchPhaiThu();

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedEntity) {
      setDetailInvoices([]);
      return;
    }
    const fetchDetails = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('debt_invoices')
        .select('*')
        .or(`customer_id.eq.${selectedEntity.id},supplier_id.eq.${selectedEntity.id}`)
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (data) {
        setDetailInvoices(data);
      }
    };
    fetchDetails();
  }, [selectedEntity]);

  const phaiTraList = suppliers.map((s: any) => {
    return { id: s.id, name: s.name, total_debt: s.debt, due_date: "N/A", status: "Trong hạn", last_tx: "N/A" };
  });

  const data = activeTab === "phai_thu" ? phaiThuList : phaiTraList;
  const totalSummaryDebt = data.reduce((sum: number, item: any) => sum + item.total_debt, 0);

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('phai_thu')}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === 'phai_thu' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Công nợ phải thu
          </button>
          <button
            onClick={() => setActiveTab('phai_tra')}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === 'phai_tra' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Công nợ phải trả
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${activeTab === "phai_thu" ? "bg-white border-blue-100" : "bg-orange-50/30 border-orange-100"} border rounded-xl p-5 shadow-sm flex flex-col justify-between h-28`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-sm font-medium ${activeTab === "phai_thu" ? "text-blue-600" : "text-orange-600"}`}>
                {activeTab === "phai_thu" ? "Tổng công nợ phải thu" : "Tổng công nợ phải trả"}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTab === "phai_thu" ? "bg-blue-50 text-blue-600" : "bg-orange-100 text-orange-600"}`}>
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-bold ${activeTab === "phai_thu" ? "text-gray-900" : "text-orange-800"}`}>
              {formatCurrency(totalSummaryDebt)}
            </div>
          </div>

          <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-red-600">Nợ quá hạn</span>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(activeTab === "phai_thu" ? overdueDebt : 0)}
            </div>
          </div>

          <div className="bg-green-50/50 border border-green-100 rounded-xl p-5 shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-green-700">
                {activeTab === "phai_thu" ? "Đã thu trong tháng" : "Đã trả trong tháng"}
              </span>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(activeTab === "phai_thu" ? collectedThisMonth : paidThisMonth)}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={activeTab === "phai_thu" ? "Tìm tên đại lý, khách hàng..." : "Tìm tên nhà cung cấp..."}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm">
              <Filter className="w-4 h-4" />
              Tất cả trạng thái
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-medium">{activeTab === "phai_thu" ? "Tên khách hàng (Đại lý)" : "Tên nhà cung cấp"}</th>
                  <th className="px-6 py-4 font-medium">Tổng nợ</th>
                  <th className="px-6 py-4 font-medium">Hạn thanh toán</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Giao dịch cuối</th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td 
                      className="px-6 py-4 font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setSelectedEntity(item)}
                    >
                      {item.name}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(item.total_debt)}</td>
                    <td className="px-6 py-4 text-gray-500">{item.due_date}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-medium">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{item.last_tx}</td>
                    <td className="px-6 py-4 text-right">
                      {activeTab === "phai_thu" ? (
                        <button 
                          onClick={() => setRemindEntity(item)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 rounded shadow-sm hover:bg-gray-50 transition-colors text-xs font-medium"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Nhắc nợ
                        </button>
                      ) : (
                        <button className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 rounded shadow-sm hover:bg-gray-50 transition-colors text-xs font-medium">
                          <CreditCard className="w-3.5 h-3.5" />
                          Trả tiền
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Không có dữ liệu công nợ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      {selectedEntity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Chi tiết công nợ - {selectedEntity.name}</h2>
              <button onClick={() => setSelectedEntity(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-[#f8fafc]">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                  <h3 className="font-bold text-gray-800 text-sm">Danh sách đơn hàng nợ</h3>
                  <div className="text-right">
                    <span className="text-sm text-gray-500 mr-2">Tổng nợ hiện tại:</span>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(selectedEntity.total_debt)}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3 font-medium">Mã đơn</th>
                        <th className="px-5 py-3 font-medium text-right">Giá trị nợ</th>
                        <th className="px-5 py-3 font-medium text-center">Hạn thanh toán</th>
                        <th className="px-5 py-3 font-medium text-center">Trạng thái</th>
                        <th className="px-5 py-3 font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detailInvoices.map((inv: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => alert("Mở chi tiết đơn hàng: " + inv.id)}>{inv.id}</td>
                          <td className="px-5 py-3 font-bold text-gray-900 text-right">{formatCurrency(inv.remaining_debt)}</td>
                          <td className="px-5 py-3 text-center text-gray-500">{inv.due_date}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-2.5 py-1 border rounded-full text-xs font-medium ${inv.status === 'Trong hạn' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button className="inline-flex items-center gap-2 px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 rounded shadow-sm hover:bg-blue-100 transition-colors text-xs font-medium">
                              <CreditCard className="w-3.5 h-3.5" />
                              Thanh toán
                            </button>
                          </td>
                        </tr>
                      ))}
                      {detailInvoices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-gray-500 italic">
                            Không có dữ liệu
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl gap-3">
              <button onClick={() => setSelectedEntity(null)} className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors">
                Trở về
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Remind Debt Modal */}
      {remindEntity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Tạo tin nhắn nhắc nợ</h2>
              <button onClick={() => setRemindEntity(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">Bạn có thể chỉnh sửa nội dung bên dưới trước khi sao chép và gửi cho khách hàng qua Zalo hoặc SMS.</p>
              <textarea 
                className="w-full h-64 p-5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed text-gray-700"
                defaultValue={`Kính gửi ${remindEntity.name},\n\nChúng tôi xin thông báo tổng công nợ hiện tại của quý khách tính đến ngày hôm nay là: ${formatCurrency(remindEntity.total_debt)}\n\nKính mong quý khách sắp xếp thanh toán trong thời gian sớm nhất.\n\nXin cảm ơn!`}
              />
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl gap-3">
              <button 
                onClick={() => setRemindEntity(null)} 
                className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  alert("Đã sao chép nội dung nhắc nợ vào Khay nhớ tạm!");
                  setRemindEntity(null);
                }} 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-600/20"
              >
                Sao chép & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

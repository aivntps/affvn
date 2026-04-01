"use client";

import React, { useState } from 'react';
import { Building2, HardDrive, UploadCloud, Download, CheckCircle2, BookOpen, AlertCircle } from 'lucide-react';

import { useGlobalData } from "@/lib/store/GlobalContext";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"company" | "backup" | "logs" | "guide">("company");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { companyInfo, setCompanyInfo, saveCompanyInfoAction } = useGlobalData() as any;

  const [formData, setFormData] = useState(companyInfo);
  const [logoPreview, setLogoPreview] = useState(companyInfo.logoUrl);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'logs') {
      const fetchLogs = async () => {
        setLogsLoading(true);
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);
        if (!error && data) {
          setLogs(data);
        }
        setLogsLoading(false);
      }
      fetchLogs();
    }
  }, [activeTab]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Kích thước file vượt quá 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInfo = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget; // Bắt nút lại trước khi thực hiện await
    
    const brandNewInfo = {
      ...formData,
      logoUrl: logoPreview
    };

    // 1. Update UI Context & Cache ngay lập tức (Optimistic)
    setCompanyInfo(brandNewInfo);
    localStorage.setItem('aff_company_info', JSON.stringify(brandNewInfo));

    // 2. Lưu xuống Supabase thông qua Server Action
    const res = await saveCompanyInfoAction(brandNewInfo);
    
    if (res?.error) {
      alert("Lỗi lưu thông tin: " + res.error);
      return;
    }

    const oriText = btn.innerText;
    btn.innerText = "Đã lưu!";
    btn.classList.add("bg-green-600", "hover:bg-green-700");
    btn.classList.remove("bg-blue-600", "hover:bg-blue-700");
    setTimeout(() => {
      btn.innerText = oriText;
      btn.classList.add("bg-blue-600", "hover:bg-blue-700");
      btn.classList.remove("bg-green-600", "hover:bg-green-700");
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-4 max-w-6xl w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setActiveTab("company")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "company" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Thông tin công ty
          </button>
          <button 
            onClick={() => setActiveTab("backup")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "backup" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Sao lưu & Phục hồi
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "logs" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Nhật ký hoạt động
          </button>
          <button 
            onClick={() => setActiveTab("guide")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "guide" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Hướng dẫn
          </button>
        </div>
      </div>

      {/* Tab 1: Company Info */}
      {activeTab === "company" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 relative">
          <div className="mb-6 pb-6 border-b border-gray-100 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Thông tin doanh nghiệp</h2>
              <p className="text-sm text-gray-500">Thông tin này sẽ được sử dụng trên hóa đơn, báo cáo và các tài liệu xuất ra từ hệ thống.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-4">
              <label className="w-48 h-48 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 bg-gray-50/50 relative cursor-pointer hover:border-blue-400 group overflow-hidden transition-colors">
                {logoPreview ? (
                   <img src={logoPreview} alt="Company Logo" className="w-full h-auto object-contain max-h-full" />
                ) : (
                   <Building2 className="w-12 h-12 text-gray-400 mb-2" />
                )}
                <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                  <UploadCloud className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">Tải ảnh lên</span>
                </div>
                <input type="file" className="hidden" accept="image/jpeg, image/png, image/svg+xml" onChange={handleLogoUpload} />
              </label>
              <div className="text-center">
                <p className="text-xs text-gray-500">Định dạng hỗ trợ: JPG, PNG, SVG.</p>
                <p className="text-xs text-gray-500">Kích thước tối đa: 2MB.</p>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tên công ty <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                <input type="text" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Địa chỉ trụ sở</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email liên hệ</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Hotline</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-end justify-between">
            <div className="text-[11px] text-gray-400 font-medium leading-relaxed">
              Marigold Inventory System v2.01<br />
              Developed by Từ Phúc Sinh
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors" onClick={handleSaveInfo}>
              Lưu thông tin
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Backup */}
      {activeTab === "backup" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col h-full relative">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                <Download className="w-5 h-5 text-gray-500" />
                Xuất dữ liệu
              </h2>
              <p className="text-sm text-gray-500">Tải xuống toàn bộ dữ liệu hiện tại của hệ thống để lưu trữ offline.</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 mt-2 h-[280px]">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <HardDrive className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-500 text-center mb-6 max-w-sm leading-relaxed">
                Bản sao lưu bao gồm: Thông tin sản phẩm, tồn kho, khách hàng, đơn hàng và lịch sử giao dịch.
              </p>
              <button 
                onClick={() => alert("Đã bắt đầu tải file sao lưu (demo)!")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 mt-auto"
              >
                <Download className="w-4 h-4" />
                Tải file dự phòng (.csv)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col h-full">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                <UploadCloud className="w-5 h-5 text-gray-500" />
                Nhập dữ liệu
              </h2>
              <p className="text-sm text-gray-500">Khôi phục dữ liệu từ file sao lưu (.csv) đã tải xuống trước đó.</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 mt-2 h-[280px] bg-white rounded-xl border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-gray-400 group-hover:text-blue-600 border border-gray-100 transition-colors">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors mb-1">
                Kéo thả file .csv vào đây
              </p>
              <p className="text-xs text-gray-500">
                hoặc click để chọn file từ máy tính
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Logs */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Lịch sử hệ thống</h2>
              <p className="text-sm text-gray-500">Hiển thị 30 hành động gần nhất của các nhân viên trên hệ thống.</p>
            </div>
            <div className="px-3 py-1.5 bg-blue-50/50 border border-blue-100 text-blue-700 rounded-lg text-xs font-semibold whitespace-nowrap">
              Tổng: {logs.length}/30
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium border-b border-gray-100 w-48">Thời gian</th>
                  <th className="px-6 py-3 font-medium border-b border-gray-100 w-64">Nhân viên</th>
                  <th className="px-6 py-3 font-medium border-b border-gray-100">Hành động</th>
                  <th className="px-6 py-3 font-medium border-b border-gray-100 text-right w-40">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {logsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Đang tải nhật ký...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa có nhật ký hoạt động nào</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(log.created_at).toLocaleString("vi-VN", {
                          hour: '2-digit', minute: '2-digit', second:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{log.nhan_vien}</td>
                      <td className="px-6 py-4 text-gray-700">{log.chi_tiet}</td>
                      <td className="px-6 py-4 text-right">
                        {log.trang_thai === "Thành công" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Thành công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {log.trang_thai}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Guide */}
      {activeTab === "guide" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-in fade-in duration-300">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Hướng dẫn & Tài liệu
            </h2>
          </div>

          <div className="space-y-8">
            {/* Nhóm 1: Dòng chảy hàng hóa */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded"></div>
                I. QUY TRÌNH KHO & ĐƠN HÀNG
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">1. Nhập kho & Bổ sung hàng hóa</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• <b>Đặt hàng:</b> Tạo đơn nhập hàng, khi tạo xong đơn sẽ ở trạng thái <b>"Hàng chờ về"</b> (chưa update tồn kho, có thể sửa đơn).</p>
                    <p>• <b>Hàng về:</b> Dùng chức năng <b>"Nhập kho"</b> (theo đơn đã đặt) để nhập số lô và Date thực tế vào kho.</p>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">2. Quy trình bán hàng & Xuất kho</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• <b>Tạo đơn:</b> Lên đơn hàng xong sẽ ở trạng thái <b>"Chờ duyệt"</b>, chưa update tồn kho (có thể sửa, hủy đơn).</p>
                    <p>• <b>Xuất kho:</b> Đổi sang <b>"Đang giao"</b> hoặc <b>"Chưa TT"</b> để hệ thống tự động trừ tồn kho thật (chỉ admin mới có thể hủy đơn).</p>
                    <p>• <b>Thanh toán:</b> Đổi sang <b>"Đã TT"</b> để hệ thống update công nợ (không thể hủy đơn).</p>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">3. Hủy đơn & Tự động Hoàn tồn</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Khi đơn báo <b>"Đã hủy"</b>, hàng tự động trả lại kho.</p>
                    <p>• <b>Hạn dùng hoàn trả:</b> Tự động hóa thiết lập <b>"6 tháng từ ngày trả"</b> cho lô hàng mới nhập lại (có thể thay đổi trong phần Kho hàng/ Cài đặt kho).</p>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">4. Nguyên tắc FIFO & Lô hàng</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• <b>FIFO:</b> Hệ thống luôn ưu tiên xuất kho lô hàng có **hạn sử dụng sớm nhất** để đảm bảo không tồn hàng cũ.</p>
                    <p>• <b>Tra cứu:</b> Bấm mũi tên ở sản phẩm để xem chi tiết phân bổ từng lô kiện.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Nhóm 2: Tài chính & Cảnh báo */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-600 rounded"></div>
                II. TÀI CHÍNH & VẬN HÀNH
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">5. Hạch toán Doanh số & Công nợ</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• <b>Doanh số:</b> Được tính khi đơn hàng chuyển sang trạng thái <b>"Chưa TT"</b> hoặc <b>"Đã TT"</b>.</p>
                    <p>• <b>Công nợ:</b> Tự động hạch toán phải thu khách hàng và phải trả NCC khi có giao dịch nợ.</p>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">6. Hệ thống Cảnh báo Hạn dùng & ROP</h4>
                  <div className="text-sm text-gray-600 space-y-3">
                    <p>• <b>Nguyên tắc Hạn dùng:</b> Hệ thống tự động quét toàn bộ lô hàng của sản phẩm và lấy <b>hạn sử dụng của lô gần nhất</b> để hiển thị. Nếu số ngày tới hạn thấp hơn mức cấu hình "Cảnh báo hạn sử dụng" (trong Cài đặt kho), cột Hạn dùng sẽ tự động <b>in Đỏ</b> và cộng vào chỉ số KPI "Hàng sắp hết hạn".</p>
                    <p>• <b>Chỉ số Cần nhập (ROP):</b> Dựa trên phân tích tốc độ bán, các sản phẩm có **ngày dự kiến đặt hàng (ROP) còn lại ≤ 7 ngày** sẽ được cảnh báo màu Cam để người quản lý chủ động đặt hàng Nhà cung cấp.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Nhóm 3: Quản trị */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-gray-600 rounded"></div>
                III. QUẢN TRỊ & BẢO MẬT
              </h3>
              
              <div className="border border-gray-100 rounded-lg p-5 bg-gray-50/50 shadow-sm border-l-4 border-l-blue-500">
                <h4 className="font-bold text-gray-900 mb-2">7. Phân quyền Khu vực quản lý</h4>
                <div className="text-sm text-gray-700">
                  Nhân viên khi đăng nhập được bảo mật dữ liệu tuyệt đối theo phân tuyến vùng. Mọi giao dịch, khách hàng được lọc tự động dựa trên <b>Khu vực</b> đã gán trong hồ sơ nhân viên. Chỉ cấp Quản trị có quyền xem toàn bộ báo cáo doanh thu tổng thể.
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

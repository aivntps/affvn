"use client";

import { useState, useMemo } from "react";
import { Plus, Search, X, Trash2 } from "lucide-react";
import { useUser } from "@/components/layout/ClientLayout";

import { useGlobalData, Customer } from "@/lib/store/GlobalContext";

interface Region {
  id: number;
  name: string;
  desc: string;
}

const initialRegions: Region[] = [
  { id: 1, name: "Thành phố Hồ Chí Minh", desc: "Khu vực nội tuyến" },
  { id: 2, name: "Ngoại thành TP.HCM", desc: "Vùng ven" },
  { id: 3, name: "Đồng Nai", desc: "Khu vực phía Đông" },
  { id: 4, name: "Bình Dương", desc: "Khu vực KCN" },
];

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "regions">("customers");
  const user = useUser();
  const userRegion = user?.khu_vuc_quan_ly || "Tất cả khu vực";
  const { customers, setCustomers } = useGlobalData();
  const [regions, setRegions] = useState<Region[]>(initialRegions);

  // Filters state
  const [customerSearch, setCustomerSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionSearch, setRegionSearch] = useState("");

  // Filtered lists optimized with useMemo
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Bảo mật cấp độ khu vực
      if (userRegion !== "Tất cả khu vực" && c.region !== userRegion) return false;

      const matchesSearch = c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                            c.phone.includes(customerSearch);
      const matchesRegion = regionFilter === "all" || c.region === regionFilter;
      const matchesType = typeFilter === "all" || c.type === typeFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesRegion && matchesType && matchesStatus;
    });
  }, [customers, customerSearch, regionFilter, typeFilter, statusFilter, userRegion]);

  const filteredRegions = useMemo(() => {
    return regions.filter(r => 
      r.name.toLowerCase().includes(regionSearch.toLowerCase()) || 
      r.desc.toLowerCase().includes(regionSearch.toLowerCase())
    );
  }, [regions, regionSearch]);

  // Modal control states
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddingRegion, setIsAddingRegion] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);

  // Form states for adding customer
  const handleAddCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCustomer: Customer = {
      id: `CUST-${String(customers.length + 1).padStart(4, '0')}`,
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      region: formData.get("region") as string,
      type: formData.get("type") as string,
      status: "Đang giao dịch",
      sales: 0,
    };
    setCustomers([newCustomer, ...customers]);
    setIsAddingCustomer(false);
  };

  const handleEditCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const formData = new FormData(e.currentTarget);
    const updated = customers.map(c => {
      if (c.id === editingCustomer.id) {
        return {
          ...c,
          name: formData.get("name") as string,
          phone: formData.get("phone") as string,
          region: formData.get("region") as string,
          type: formData.get("type") as string,
          status: formData.get("status") as string,
        };
      }
      return c;
    });
    setCustomers(updated);
    setEditingCustomer(null);
  };

  const handleAddRegionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRegion: Region = {
      id: Date.now(),
      name: formData.get("name") as string,
      desc: formData.get("desc") as string,
    };
    setRegions([newRegion, ...regions]);
    setIsAddingRegion(false);
  };

  const handleEditRegionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRegion) return;
    const formData = new FormData(e.currentTarget);
    const updated = regions.map(r => {
      if (r.id === editingRegion.id) {
        return {
          ...r,
          name: formData.get("name") as string,
          desc: formData.get("desc") as string,
        };
      }
      return r;
    });
    setRegions(updated);
    setEditingRegion(null);
  };

  const handleDeleteCustomer = () => {
    if (!editingCustomer) return;
    if (editingCustomer.sales > 0) {
      alert("Không thể xóa khách hàng này vì đã phát sinh dữ liệu mua hàng (PO)!");
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa khách hàng "${editingCustomer.name}"?`)) {
      setCustomers(customers.filter(c => c.id !== editingCustomer.id));
      setEditingCustomer(null);
    }
  };

  const handleDeleteRegion = () => {
    if (!editingRegion) return;
    // Basic confirmation
    const customersInRegion = customers.filter(c => c.region === editingRegion.name).length;
    let message = `Bạn có chắc muốn xóa khu vực "${editingRegion.name}"?`;
    
    if (customersInRegion > 0) {
      message += `\nLưu ý: Có ${customersInRegion} khách hàng thuộc khu vực này. Nếu bạn xóa, khu vực của họ sẽ chuyển thành "Chưa phân loại".`;
    }

    if (confirm(message)) {
      setRegions(regions.filter(r => r.id !== editingRegion.id));
      
      // Update orphaned customers
      if (customersInRegion > 0) {
        setCustomers(customers.map(c => 
          c.region === editingRegion.name ? { ...c, region: "Chưa phân loại" } : c
        ));
      }
      
      setEditingRegion(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      <div className="flex items-center justify-between border-b border-gray-200">
        {/* Tabs */}
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setActiveTab("customers")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "customers" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Khách hàng
          </button>
          <button 
            onClick={() => setActiveTab("regions")}
            className={`pb-3 border-b-2 font-bold text-lg transition-colors ${activeTab === "regions" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Khu vực
          </button>
        </div>

        {/* Action Button */}
        <div className="pb-2">
          {activeTab === "customers" ? (
            <button 
              onClick={() => setIsAddingCustomer(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm khách hàng
            </button>
          ) : (
            <button 
              onClick={() => setIsAddingRegion(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm khu vực
            </button>
          )}
        </div>
      </div>


      {/* Customers Tab Content */}
      {activeTab === "customers" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên, SĐT, mã KH..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <select 
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 border-none rounded-lg text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả khu vực</option>
                {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 border-none rounded-lg text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Khách sỉ">Khách sỉ</option>
                <option value="Khách lẻ">Khách lẻ</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 border-none rounded-lg text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Đang giao dịch">Đang giao dịch</option>
                <option value="Ngừng giao dịch">Ngừng giao dịch</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Tên khách hàng</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Khu vực</th>
                  <th className="px-6 py-4">Doanh số</th>
                  <th className="px-6 py-4">Loại</th>
                  <th className="px-6 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className={`hover:bg-gray-50 transition-colors ${customer.status === 'Ngừng giao dịch' ? 'opacity-60' : ''}`}>
                    <td 
                      className="px-6 py-4 text-blue-600 font-medium cursor-pointer hover:underline"
                      onClick={() => setEditingCustomer(customer)}
                    >
                      {customer.name}
                    </td>
                    <td className="px-6 py-4">{customer.phone}</td>
                    <td className="px-6 py-4">{customer.region}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{customer.sales.toLocaleString('vi-VN')} đ</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${customer.type === 'Khách sỉ' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        {customer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${customer.status === 'Đang giao dịch' ? 'text-blue-600' : 'text-gray-500'}`}>
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regions Tab Content */}
      {activeTab === "regions" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white">
             <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm khu vực..."
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
             <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Tên Khu Vực</th>
                  <th className="px-6 py-4">Mô tả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegions.map((region) => (
                  <tr key={region.id} className="hover:bg-gray-50 transition-colors">
                    <td 
                      className="px-6 py-4 text-blue-600 font-medium cursor-pointer hover:underline"
                      onClick={() => setEditingRegion(region)}
                    >
                      {region.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{region.desc}</td>
                  </tr>
                ))}
              </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
             <button onClick={() => setIsAddingCustomer(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
               <X className="w-5 h-5" />
             </button>
             <h2 className="text-xl font-bold text-gray-900 mb-6">Thêm Khách hàng mới</h2>
             <form className="space-y-4" onSubmit={handleAddCustomerSubmit}>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng *</label>
                  <input name="name" required placeholder="Nhập tên khách hàng" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input name="phone" required placeholder="09xxxxxxxxx" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div>
                    <label className="text-sm font-medium text-gray-700">Khu vực *</label>
                    <select name="region" required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      {regions.filter(r => userRegion === "Tất cả khu vực" || r.name === userRegion).map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại khách *</label>
                  <select name="type" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Khách sỉ">Khách sỉ</option>
                    <option value="Khách lẻ">Khách lẻ</option>
                  </select>
               </div>
               <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsAddingCustomer(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
                 <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Lưu khách hàng</button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
             <button onClick={() => setEditingCustomer(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
               <X className="w-5 h-5" />
             </button>
             <h2 className="text-xl font-bold text-gray-900 mb-6">Sửa thông tin Khách hàng</h2>
             <form className="space-y-4" onSubmit={handleEditCustomerSubmit}>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã KH</label>
                  <input readOnly value={editingCustomer.id} className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none cursor-not-allowed text-gray-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng *</label>
                  <input name="name" required defaultValue={editingCustomer.name} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input name="phone" required defaultValue={editingCustomer.phone} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực *</label>
                  <select name="region" required defaultValue={editingCustomer.region} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại khách *</label>
                  <select name="type" required defaultValue={editingCustomer.type} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Khách sỉ">Khách sỉ</option>
                    <option value="Khách lẻ">Khách lẻ</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái giao dịch</label>
                  <select name="status" required defaultValue={editingCustomer.status} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Đang giao dịch">Đang giao dịch</option>
                    <option value="Ngừng giao dịch">Ngừng giao dịch (Vô hiệu hóa)</option>
                  </select>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-gray-100 mt-4">
                  <button 
                    type="button" 
                    onClick={handleDeleteCustomer} 
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditingCustomer(null)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Lưu thay đổi</button>
                  </div>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* Add Region Modal */}
      {isAddingRegion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
             <button onClick={() => setIsAddingRegion(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
               <X className="w-5 h-5" />
             </button>
             <h2 className="text-xl font-bold text-gray-900 mb-6">Thêm Khu vực mới</h2>
             <form className="space-y-4" onSubmit={handleAddRegionSubmit}>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khu vực *</label>
                  <input name="name" required placeholder="VD: Miền Tây" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sơ lược</label>
                   <textarea name="desc" placeholder="Ghi chú thêm về khu vực này" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 h-24 whitespace-pre-wrap" />
               </div>
               <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsAddingRegion(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
                 <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Lưu khu vực</button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* Edit Region Modal */}
      {editingRegion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
             <button onClick={() => setEditingRegion(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
               <X className="w-5 h-5" />
             </button>
             <h2 className="text-xl font-bold text-gray-900 mb-6">Sửa Khu vực</h2>
             <form className="space-y-4" onSubmit={handleEditRegionSubmit}>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khu vực *</label>
                  <input name="name" required defaultValue={editingRegion.name} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sơ lược</label>
                   <textarea name="desc" defaultValue={editingRegion.desc} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 h-24 whitespace-pre-wrap" />
               </div>
               <div className="pt-4 flex items-center gap-3">
                 <button type="button" onClick={handleDeleteRegion} className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 font-medium flex items-center gap-1 transition-colors">
                   <Trash2 className="w-4 h-4" />
                   Xóa
                 </button>
                 <div className="flex-1 flex gap-3 justify-end border-l border-gray-200 pl-3">
                   <button type="button" onClick={() => setEditingRegion(null)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
                   <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Lưu thay đổi</button>
                 </div>
               </div>
             </form>
           </div>
        </div>
      )}

    </div>
  );
}

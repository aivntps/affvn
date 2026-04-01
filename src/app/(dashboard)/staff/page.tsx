"use client";

import { useMemo, Suspense } from "react";
import AddStaffModal from "./AddStaffModal";
import StaffItemActions, { Staff } from "./StaffItemActions";
import StaffFilters from "./StaffFilters";
import { useUser } from "@/components/layout/ClientLayout";
import { useSearchParams } from "next/navigation";

import { useGlobalData } from "@/lib/store/GlobalContext";function StaffTableContent() {
  const user = useUser();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "all";

  // Dùng user thực tế từ context nếu đã login, ngược lại dùng mock admin cho tiện test
  const currentUserId = user?.id || "STAFF-01"; 
  const isAdmin = user ? (user.vai_tro === "Giám đốc") : true; 

  const { staffList, setStaffList } = useGlobalData();

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchSearch = s.ho_ten.toLowerCase().includes(search.toLowerCase()) || 
                          (s.tai_khoan && s.tai_khoan.toLowerCase().includes(search.toLowerCase()));
      const matchRole = role === "all" || s.vai_tro === role;
      return matchSearch && matchRole;
    });
  }, [staffList, search, role]);

  const handleAddStaff = (newStaff: Staff) => {
    setStaffList([newStaff, ...staffList]);
  };

  const handleUpdateStaff = (id: string, updatedStaff: Partial<Staff>) => {
    setStaffList(staffList.map(s => s.id === id ? { ...s, ...updatedStaff } : s));
  };

  const handleDeleteStaff = (id: string) => {
    setStaffList(staffList.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-end">
        {isAdmin && <AddStaffModal onAdd={handleAddStaff} />}
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <StaffFilters />

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Tài khoản</th>
                <th className="px-6 py-4">Họ và tên</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Khu vực quản lý</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((staff: Staff) => (
                <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{staff.tai_khoan || 'Chưa có'}</td>
                  <td className="px-6 py-4 text-blue-600 font-medium">{staff.ho_ten}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                      {staff.vai_tro}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {staff.khu_vuc_quan_ly || "Tất cả khu vực"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StaffItemActions 
                      staff={staff} 
                      isAdmin={isAdmin} 
                      currentUserId={currentUserId}
                      onUpdate={handleUpdateStaff}
                      onDelete={handleDeleteStaff}
                    />
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">Chưa có nhân viên nào trong hệ thống</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<div className="p-4 bg-gray-50 border border-gray-100 h-16 animate-pulse rounded-xl" />}>
      <StaffTableContent />
    </Suspense>
  )
}

"use client"

import { useState } from "react"
import { Edit, Trash2, X } from "lucide-react"

export interface Staff {
  id: string
  ho_ten: string
  tai_khoan?: string
  vai_tro: string
  khu_vuc_quan_ly?: string
}

export default function StaffItemActions({ 
  staff, 
  isAdmin, 
  currentUserId,
  onUpdate,
  onDelete
}: { 
  staff: Staff, 
  isAdmin: boolean, 
  currentUserId?: string,
  onUpdate: (id: string, data: Partial<Staff>) => void,
  onDelete: (id: string) => void
}) {
  const [isEditOpen, setIsEditOpen] = useState(false)

  function handleDelete() {
    if (!confirm(`Bạn có chắc muốn xóa nhân viên "${staff.ho_ten}" không?`)) return
    onDelete(staff.id)
  }

  function handleUpdateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const ho_ten = formData.get("ho_ten") as string
    const vai_tro = formData.get("vai_tro") as string | undefined
    const khu_vuc_quan_ly = formData.get("khu_vuc_quan_ly") as string | undefined
    
    const updatedData: Partial<Staff> = { ho_ten }
    if (vai_tro) updatedData.vai_tro = vai_tro
    if (khu_vuc_quan_ly) updatedData.khu_vuc_quan_ly = khu_vuc_quan_ly

    onUpdate(staff.id, updatedData)
    setIsEditOpen(false)
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3 text-sm font-medium">
        {(isAdmin || currentUserId === staff.id) && (
          <button 
            onClick={() => setIsEditOpen(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            Sửa
          </button>
        )}
        {isAdmin && (
          <button 
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </button>
        )}
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] text-left">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Chỉnh sửa nhân viên</h2>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Tài khoản (Không đổi)</label>
                <input disabled value={staff.tai_khoan || ""} type="text" className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới (Để trống nếu ko đổi)</label>
                <input name="password" type="password" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input name="ho_ten" required defaultValue={staff.ho_ten} type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select 
                  name="vai_tro" 
                  disabled={!isAdmin}
                  defaultValue={staff.vai_tro} 
                  className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <option value="Nhân viên Sale">Nhân viên Sale</option>
                  <option value="Thủ kho">Thủ kho</option>
                  <option value="Kế toán">Kế toán</option>
                  <option value="Giám đốc">Giám đốc</option>
                </select>
                {!isAdmin && <p className="text-[10px] text-gray-400 mt-1">* Chỉ Giám đốc mới có quyền đổi vai trò</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực quản lý</label>
                <select 
                  name="khu_vuc_quan_ly" 
                  disabled={!isAdmin}
                  defaultValue={staff.khu_vuc_quan_ly || "Tất cả khu vực"} 
                  className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${!isAdmin ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <option value="Tất cả khu vực">Tất cả khu vực</option>
                  <option value="Thành phố Hồ Chí Minh">Thành phố Hồ Chí Minh</option>
                  <option value="Ngoại thành TP.HCM">Ngoại thành TP.HCM</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                  <option value="Bình Dương">Bình Dương</option>
                </select>
                {!isAdmin && <p className="text-[10px] text-gray-400 mt-1">* Chỉ Giám đốc mới có quyền đổi khu vực</p>}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

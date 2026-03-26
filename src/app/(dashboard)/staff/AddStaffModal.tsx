"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Staff } from "./StaffItemActions"

export default function AddStaffModal({ onAdd }: { onAdd: (staff: Staff) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const newStaff: Staff = {
      id: `STAFF-${Date.now()}`,
      tai_khoan: formData.get("tai_khoan") as string,
      ho_ten: formData.get("ho_ten") as string,
      vai_tro: formData.get("vai_tro") as string,
      khu_vuc_quan_ly: formData.get("khu_vuc_quan_ly") as string || "Tất cả khu vực",
    }
    
    onAdd(newStaff)
    setIsOpen(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Thêm nhân viên
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Thêm nhân viên mới</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản (Viết liền ko dấu)</label>
                <input name="tai_khoan" required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="nguyenvana" />
                <p className="text-[11px] text-gray-500 mt-1 italic">
                  * Mật khẩu mặc định: <span className="font-bold text-blue-600">123456</span> (Yêu cầu đổi khi đăng nhập lần đầu)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input name="ho_ten" required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select name="vai_tro" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Nhân viên Sale">Nhân viên Sale</option>
                  <option value="Thủ kho">Thủ kho</option>
                  <option value="Kế toán">Kế toán</option>
                  <option value="Giám đốc">Giám đốc</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực quản lý (Tùy chọn)</label>
                <select name="khu_vuc_quan_ly" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Tất cả khu vực">Tất cả khu vực</option>
                  <option value="Thành phố Hồ Chí Minh">Thành phố Hồ Chí Minh</option>
                  <option value="Ngoại thành TP.HCM">Ngoại thành TP.HCM</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                  <option value="Bình Dương">Bình Dương</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Lưu nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

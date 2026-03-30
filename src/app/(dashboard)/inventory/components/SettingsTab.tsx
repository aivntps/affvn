import React, { useState, useEffect } from 'react';
import { useGlobalData } from '@/lib/store/GlobalContext';

export function SettingsTab() {
  const { inventoryConfig, setInventoryConfig, saveInventoryConfigAction } = useGlobalData();
  const [localConfig, setLocalConfig] = useState(inventoryConfig);

  useEffect(() => {
    setLocalConfig(inventoryConfig);
  }, [inventoryConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalConfig({ ...localConfig, [e.target.name]: Number(e.target.value) });
  };

  const handleSave = async () => {
    setInventoryConfig(localConfig);
    const res = await saveInventoryConfigAction?.(localConfig);
    if (res?.error) {
      alert("Lỗi lưu cấu hình: " + res.error);
    } else {
      alert("Cập nhật cài đặt kho thành công (đã lưu lên cloud)!");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-4xl">
       <h2 className="text-lg font-bold text-gray-900 mb-6">Cài đặt thông số kho hàng</h2>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
         <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Thời gian nhập hàng trung bình (ngày)</label>
            <input type="number" name="leadTimeAvg" value={localConfig.leadTimeAvg} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-500 mt-1">Thời gian trung bình từ lúc lên đơn đến khi hàng nhập kho</p>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Thời gian nhập hàng lâu nhất (ngày)</label>
            <input type="number" name="leadTimeMax" value={localConfig.leadTimeMax} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
         </div>

         <div className="col-span-1 md:col-span-2 border-t border-gray-100"></div>

         <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Dung tích kho tối đa</label>
            <input type="number" name="maxCapacity" value={localConfig.maxCapacity} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-500 mt-1">Tránh trường hợp đặt quá nhiều dẫn đến quá tải sức chứa của kho</p>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Đơn vị vận chuyển tối thiểu (MOQ)</label>
            <input type="number" name="minMoq" value={localConfig.minMoq} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-500 mt-1">Ví dụ: Phải đủ 1 container hoặc tối thiểu 10 pallet/loại</p>
         </div>

         <div className="col-span-1 md:col-span-2 border-t border-gray-100"></div>

         <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Chi phí lưu kho (VNĐ/đơn vị)</label>
            <input type="number" name="storageCost" value={localConfig.storageCost} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-500 mt-1">Để tính toán xem lượng đặt mỗi lần (Q) là bao nhiêu thì rẻ nhất</p>
         </div>
         <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Cảnh báo hạn sử dụng (ngày)</label>
            <input 
              type="number" 
              name="expWarningDays"
              value={localConfig.expWarningDays} 
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <p className="text-xs text-gray-500 mt-1">Thời gian hiển thị cảnh báo trước khi sản phẩm hết hạn</p>
         </div>

         <div className="col-span-1 md:col-span-2 border-t border-gray-100"></div>

         <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Hạn dùng mặc định hàng hoàn/hủy (tháng)</label>
            <input 
              type="number" 
              name="returnExpiryMonths"
              value={localConfig.returnExpiryMonths} 
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <p className="text-xs text-gray-500 mt-1">Cộng dồn vào ngày hiện tại để làm Hạn sử dụng cho hàng thu hồi về kho</p>
         </div>
       </div>

        <div className="mt-8">
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Lưu cài đặt
          </button>
       </div>
    </div>
  );
}

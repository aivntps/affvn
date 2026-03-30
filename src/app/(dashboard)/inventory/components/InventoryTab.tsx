import React, { useState, useMemo } from 'react';
import { Search, Filter, Box, AlertTriangle, DollarSign, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { InventoryItem } from '../types';
import { formatCurrency, getRopColor } from '../utils';
import { useGlobalData } from '@/lib/store/GlobalContext';

// expDate is now pre-calculated from DB triggers directly on the item

interface InventoryTabProps {
  inventory: InventoryItem[];
  setEditingProduct: (product: InventoryItem) => void;
}

export function InventoryTab({ inventory, setEditingProduct }: InventoryTabProps) {
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const { inventoryConfig } = useGlobalData();
  const expWarningDays = inventoryConfig.expWarningDays;

  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [inventory]);

  return (
    <div className="flex flex-col space-y-4 flex-1">
      {/* Utility Bar (KPI + Filters) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        {/* KPI Slim Bar */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 divide-x divide-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-gray-500">Cần nhập hàng (ROP≤ 7 ngày):</span>
            <span className="text-lg font-bold text-orange-600">{inventory.filter(i => i.daysToReorder <= 7).length}</span>
          </div>
          <div className="flex items-center gap-2 pl-6">
            <span className="text-base font-medium text-gray-500">Hàng sắp hết hạn (dưới {expWarningDays} ngày):</span>
            <span className="text-lg font-bold text-red-600">
              {inventory.filter(i => {
                const exp = i.expDate;
                return exp && new Date(exp).getTime() < Date.now() + expWarningDays * 24 * 60 * 60 * 1000;
              }).length}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-6">
            <span className="text-base font-medium text-gray-500">Tổng giá trị tồn:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(inventory.reduce((sum, item) => sum + item.stock * item.price, 0))}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-1 xl:flex-none items-center gap-3">
          <div className="relative w-full xl:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm SKU, sản phẩm..."
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Tên sản phẩm</th>
                <th className="px-6 py-4">Quy cách</th>
                <th className="px-6 py-4 text-center">Trạng thái KD</th>
                <th className="px-6 py-4 text-center">Tồn kho</th>
                <th className="px-6 py-4 text-center">Ngày đến hạn đặt (ROP)</th>
                <th className="px-6 py-4 text-center">Hạn sử dụng</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedInventory.map((item, idx) => (
                <React.Fragment key={idx}>
                  <tr className={`hover:bg-gray-50 transition-colors ${item.status === 'Ngừng KD' ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 text-gray-500 cursor-pointer" onClick={() => setExpandedSku(expandedSku === item.sku ? null : item.sku)}>
                      {expandedSku === item.sku ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </td>
                    <td className="px-6 py-4 text-blue-600 font-semibold cursor-pointer" onClick={() => setExpandedSku(expandedSku === item.sku ? null : item.sku)}>{item.name}</td>
                    <td className="px-6 py-4 text-gray-500">{item.spec}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${item.status === 'Đang KD' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 text-center">{item.stock}</td>
                    <td className={`px-6 py-4 text-center ${getRopColor(item.daysToReorder)}`}>
                      {item.daysToReorder} ngày
                    </td>
                    <td className={`px-6 py-4 text-center font-medium ${item.expDate && new Date(item.expDate).getTime() < Date.now() + expWarningDays * 24 * 60 * 60 * 1000 ? 'text-red-500' : 'text-gray-500'}`}>
                      {item.expDate || '-'}
                    </td>
                    <td className="px-6 py-4 text-center flex justify-center">
                      <button onClick={() => setEditingProduct(item)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  
                  {expandedSku === item.sku && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={7} className="px-6 py-4 border-b border-gray-100">
                        <div className="pl-6 border-l-2 border-blue-200 py-2">
                          {item.batches && item.batches.length > 0 ? (
                            <table className="w-1/2 text-sm text-left border rounded-lg overflow-hidden shadow-sm">
                              <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                  <th className="px-4 py-2 font-medium border-b">Hạn sử dụng</th>
                                  <th className="px-4 py-2 font-medium border-b text-center">Số lượng tồn</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {item.batches.map((batch, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className={`px-4 py-2 font-medium ${new Date(batch.expDate).getTime() < Date.now() + expWarningDays * 24 * 60 * 60 * 1000 ? 'text-red-500' : 'text-gray-700'}`}>{batch.expDate || 'Không xác định'}</td>
                                    <td className="px-4 py-2 text-center font-bold text-gray-900">{batch.qty}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-sm text-gray-500 italic">Sản phẩm chưa có dữ liệu lô hàng.</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

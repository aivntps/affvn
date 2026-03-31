import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Order } from '../types';
import { formatCurrency } from '../utils';

interface OrdersTabProps {
  orders: Order[];
  setEditingPO: (po: Order) => void;
  setIsReceivingStock: (val: boolean) => void;
  setInitialPoId: (id: string | undefined) => void;
}

export function OrdersTab({ orders, setEditingPO, setIsReceivingStock, setInitialPoId }: OrdersTabProps) {
  return (
    <div className="flex flex-col space-y-6 flex-1">
      <div className="flex flex-col sm:flex-row gap-3">
         <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            />
         </div>
         <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium shadow-sm transition-colors w-max">
            <Filter className="w-4 h-4" />
            Lọc
         </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Nhà cung cấp</th>
                <th className="px-6 py-4">Số lượng</th>
                <th className="px-6 py-4">Quy cách</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td 
                    onClick={() => setEditingPO(JSON.parse(JSON.stringify(order)))}
                    className="px-6 py-4 font-bold text-blue-600 cursor-pointer hover:underline"
                  >
                    {order.id}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{order.supplier}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{order.qty}</td>
                  <td className="px-6 py-4 text-gray-500 italic text-xs max-w-[200px] truncate" title={order.spec}>
                    {order.spec}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{formatCurrency(order.price)}</td>
                  <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${order.status === 'Hàng chờ về' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {order.status === 'Hàng chờ về' && (
                      <>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setInitialPoId(order.id);
                            setIsReceivingStock(true); 
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        >
                          Nhập kho
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingPO(JSON.parse(JSON.stringify(order))); }}
                          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        >
                          Sửa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

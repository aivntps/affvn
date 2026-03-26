import React from 'react';
import { Search, Filter, Users, DollarSign } from 'lucide-react';
import { Supplier } from '../types';
import { formatCurrency } from '../utils';

interface SuppliersTabProps {
  suppliers: Supplier[];
  setIsAddingSupplier: (open: boolean) => void;
}

export function SuppliersTab({ suppliers, setIsAddingSupplier }: SuppliersTabProps) {
  return (
    <div className="flex flex-col space-y-6 flex-1">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
         <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã, tên nhà cung cấp..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            />
         </div>
         <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium shadow-sm transition-colors w-max">
            <Filter className="w-4 h-4" />
            Lọc
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tổng nhà cung cấp</span>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{suppliers.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Đang hợp tác</span>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{suppliers.filter(s => s.status === 'Đang hợp tác').length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6 text-red-600">
            <span className="text-sm font-medium uppercase tracking-wider">Tổng nợ NCC</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(suppliers.reduce((sum, s) => sum + s.debt, 0))}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Mã NCC</th>
                <th className="px-6 py-4">Tên nhà cung cấp</th>
                <th className="px-6 py-4">Số điện thoại</th>
                <th className="px-6 py-4">Khu vực</th>
                <th className="px-6 py-4 text-right">Dư nợ</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((ncc, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors text-sm">
                  <td className="px-6 py-4 font-medium text-gray-900">{ncc.id}</td>
                  <td className="px-6 py-4 font-bold text-blue-600 underline cursor-pointer">{ncc.name}</td>
                  <td className="px-6 py-4 text-gray-600">{ncc.contact}</td>
                  <td className="px-6 py-4 text-gray-500">{ncc.address}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(ncc.debt)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ncc.status === 'Đang hợp tác' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {ncc.status}
                    </span>
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

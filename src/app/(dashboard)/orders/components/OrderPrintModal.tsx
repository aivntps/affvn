"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SaleOrder } from "../types";
import { useGlobalData } from "@/lib/store/GlobalContext";

export default function OrderPrintModal({
  order,
  onClose
}: {
  order: SaleOrder;
  onClose: () => void;
}) {
  const { companyInfo, inventory } = useGlobalData();
  const printRef = useRef<HTMLDivElement>(null);



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  let day = ".....", month = ".....", year = "20...";
  const parts = order.date.split(/[-/]/);
  if (parts.length === 3) {
     if (parts[0].length === 4) {
        year = parts[0]; month = parts[1]; day = parts[2];
     } else {
        day = parts[0]; month = parts[1]; year = parts[2];
     }
  }

  const [printContainer, setPrintContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Tạo 1 div bao ngoài riêng biệt để tránh dính CSS chung của layout Nextjs
    const rootEl = document.createElement('div');
    rootEl.className = 'print-only-wrapper';
    document.body.appendChild(rootEl);
    setPrintContainer(rootEl);

    const style = document.createElement('style');
    style.id = "print-style";
    style.innerHTML = `
      @media screen {
        .print-only-wrapper { display: none !important; }
      }
      @media print {
        @page { size: A5 landscape; margin: 5mm; }
        body { margin: 0; padding: 0; background-color: white !important; }
        /* Ẩn toàn bộ Element trong Body TRỪ thẻ bản in của chúng ta */
        body > *:not(.print-only-wrapper) { display: none !important; }
        .print-only-wrapper { 
          display: block !important; 
          width: 100%; 
          padding: 0;
          position: absolute; 
          left: 0; 
          top: 0;
        }
        /* Mặc định tắt thanh cuộn khi in */
        ::-webkit-scrollbar { display: none; }
      }
    `;
    document.head.appendChild(style);

    // Chờ Portal Render xong khoảng 300ms rồi mới gọi lệnh In
    const timer = setTimeout(() => {
      window.print();
      onClose();
    }, 300);

    return () => {
      clearTimeout(timer);
      const s = document.getElementById("print-style");
      if (s) s.remove();
      if (document.body.contains(rootEl)) {
        document.body.removeChild(rootEl);
      }
    };
  }, [onClose]);

  if (!printContainer) return null;

  return createPortal(
    <div ref={printRef} className="bg-white text-black w-full p-4 mx-auto relative print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2">
            <div className="flex items-center gap-4">
              {companyInfo?.logoUrl ? (
                <img src={companyInfo.logoUrl} alt="Logo" className="w-[140px] object-contain shrink-0" />
              ) : (
                <div className="w-[140px] h-[40px] bg-gray-100 text-xs font-bold flex items-center justify-center shrink-0">
                  LOGO DOANH NGHIỆP
                </div>
              )}
              <div className="text-xs">
                <h1 className="font-bold text-base uppercase text-[#1e3a8a]">{companyInfo?.name || "CÔNG TY ASEAN FINE FOODS"}</h1>
                <p className="mt-1"><span className="font-semibold">ĐC:</span> {companyInfo?.address || "17 Đào Duy Anh, P Phú Nhuận, TPHCM"}</p>
                <p><span className="font-semibold">ĐT:</span> {companyInfo?.phone || "0932 469 479"}</p>
                <p><span className="font-semibold">MST:</span> {companyInfo?.taxId || "8888-9999"}</p>
              </div>
            </div>
            
            <div className="text-right text-xs">
              <p><span className="font-semibold">Mã HĐ:</span> {order.id}</p>
              <p><span className="font-semibold">Ngày:</span> {order.date}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-2">
            <h2 className="text-xl font-bold uppercase text-[#1e3a8a]">Phiếu giao hàng</h2>
          </div>

          {/* Customer Info */}
          <div className="text-xs space-y-1 mb-2 text-gray-900">
            <h3 className="font-bold text-sm mb-1">Thông tin khách hàng:</h3>
            <div className="flex justify-between">
              <p><span className="font-semibold">Tên khách hàng:</span> {order.customerName}</p>
              <p><span className="font-semibold">Điện thoại:</span> {order.customerPhone || "---"}</p>
            </div>
            <p><span className="font-semibold">Địa chỉ:</span> {order.customerRegion}</p>
          </div>

          {/* Table */}
          <table className="w-full text-xs border-collapse border border-slate-800 mb-2">
            <thead>
              <tr className="bg-slate-50 text-slate-800">
                <th className="border border-slate-800 py-1.5 px-2 w-10 text-center font-bold">STT</th>
                <th className="border border-slate-800 py-1.5 px-2 text-left font-bold">Hàng hóa</th>
                <th className="border border-slate-800 py-1.5 px-2 w-28 text-center font-bold">Quy cách</th>
                <th className="border border-slate-800 py-1.5 px-2 w-20 text-center font-bold">Số lượng</th>
                <th className="border border-slate-800 py-1.5 px-2 w-28 text-center font-bold">Đơn giá</th>
                <th className="border border-slate-800 py-1.5 px-2 w-32 text-center font-bold">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const invItem = inventory.find(p => p.sku === item.productId);
                let displayName = item.name;
                
                if (invItem && invItem.conversionRate > 0) {
                  const storageUnitCount = Math.floor(item.qty / invItem.conversionRate);
                  const specCount = item.qty % invItem.conversionRate;
                  const parts = [];
                  
                  if (storageUnitCount > 0) parts.push(`${storageUnitCount} ${invItem.storageUnit || 'Thùng'}`);
                  if (specCount > 0) parts.push(`${specCount} ${invItem.spec || 'Hộp'}`);
                  
                  if (parts.length > 0) {
                    displayName = `${item.name} (${parts.join(' ')})`;
                  }
                }
                
                return (
                  <tr key={idx}>
                    <td className="border border-slate-800 py-1.5 px-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-800 py-1.5 px-2 leading-tight">{displayName}</td>
                    <td className="border border-slate-800 py-1.5 px-2 text-center text-gray-600 font-medium">{invItem?.spec || '-'}</td>
                    <td className="border border-slate-800 py-1.5 px-2 text-center">{item.qty}</td>
                    <td className="border border-slate-800 py-1.5 px-2 text-center">{formatCurrency(item.price)}</td>
                    <td className="border border-slate-800 py-1.5 px-2 text-center">{formatCurrency(item.qty * item.price)}</td>
                  </tr>
                );
              })}
              {/* Padding empty rows if few items to keep form shape nice */}
              {order.items.length < 2 && (
                <tr><td className="border border-slate-800 py-2 px-2"></td><td className="border border-slate-800"></td><td className="border border-slate-800"></td><td className="border border-slate-800"></td><td className="border border-slate-800"></td><td className="border border-slate-800"></td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="border border-slate-800 py-1.5 px-2 text-right font-bold uppercase">Tổng cộng tiền thanh toán:</td>
                <td className="border border-slate-800 py-1.5 px-2 text-center font-bold text-sm">{formatCurrency(order.total)} đ</td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures */}
          <div className="flex justify-between mt-4 text-xs px-10">
            <div className="text-center pt-2">
              <p className="font-bold">Khách hàng</p>
              <p className="italic text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p>
            </div>
            <div className="text-center flex flex-col">
              <p className="italic text-gray-900 mb-1">Ngày {day} tháng {month} năm {year}</p>
              <p className="font-bold">Người bán hàng</p>
              <p className="italic text-gray-500 mt-1 mb-10">(Ký, ghi rõ họ tên)</p>
              <p className="font-bold text-gray-900 uppercase">{order.staffName}</p>
            </div>
          </div>
          
        </div>
    , printContainer
  );
}

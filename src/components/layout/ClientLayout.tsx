"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useGlobalData } from "@/lib/store/GlobalContext";

export const UserContext = createContext<any>(null);

export function useUser() {
  return useContext(UserContext);
}

export function ClientLayout({ children, user }: { children: React.ReactNode, user: any }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { companyInfo } = useGlobalData();

  // Đóng sidebar khi chuyển trang trên mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Ngăn cuộn body khi mở sidebar trên mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 z-40">
        <div className="flex h-8 items-center">
          {companyInfo?.logoUrl ? (
            <img src={companyInfo.logoUrl} alt={companyInfo.name} className="max-h-full max-w-[120px] object-contain" />
          ) : (
            <span className="font-bold text-blue-600 text-lg tracking-tight truncate max-w-[200px]">{companyInfo?.name || "AFF System"}</span>
          )}
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 -mr-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <Sidebar user={user} onClose={() => setIsSidebarOpen(false)} />
      </div>
      
      {/* Main content area */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen relative pt-16 lg:pt-0 w-full">
        <div className="flex-1 p-4 lg:p-8 w-full max-w-[100vw] lg:max-w-none overflow-x-hidden">
          <UserContext.Provider value={user}>
            {children}
          </UserContext.Provider>
        </div>
      </main>
    </div>
  );
}

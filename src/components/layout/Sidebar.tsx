"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  UserPlus,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import { useGlobalData } from "@/lib/store/GlobalContext";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Khách hàng", href: "/customers", icon: Users },
  { name: "Kho hàng", href: "/inventory", icon: Package },
  { name: "Đơn hàng", href: "/orders", icon: ShoppingCart },
  { name: "Công nợ", href: "/debt", icon: CreditCard },
  { name: "Báo cáo", href: "/reports", icon: BarChart3 },
  { name: "Nhân viên", href: "/staff", icon: UserPlus },
  { name: "Cài đặt", href: "/settings", icon: Settings },
];

export function Sidebar({ user, onClose }: { user?: any, onClose?: () => void }) {
  const { companyInfo } = useGlobalData();
  const pathname = usePathname();
  const userName = user?.ho_ten || "Người dùng";
  const userRole = user?.vai_role || "Nhân viên";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col w-64 h-screen border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="flex items-center justify-center p-3 border-b border-gray-50 shrink-0">
        {companyInfo?.logoUrl ? (
          <img 
            src={companyInfo.logoUrl} 
            alt={companyInfo.name} 
            className="w-full h-auto object-contain max-h-[80px]"
          />
        ) : (
          <div className="font-bold text-blue-600 text-xl tracking-tight truncate w-full text-center">
            {companyInfo?.name || "AFF System"}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")}
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate" title={userName}>
              {userName}
            </p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
        </div>
        
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors cursor-pointer group"
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-600" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}


"use client"

import { Search } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export default function StaffFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set("search", term)
    } else {
      params.delete("search")
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  function handleFilter(role: string) {
    const params = new URLSearchParams(searchParams)
    if (role && role !== "all") {
      params.set("role", role)
    } else {
      params.delete("role")
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white">
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm theo tên, tài khoản..."
          defaultValue={searchParams.get("search")?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      <div className="flex w-full sm:w-auto gap-3">
        <select 
          defaultValue={searchParams.get("role")?.toString() || "all"}
          onChange={(e) => handleFilter(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 border-none rounded-lg text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="Giám đốc">Giám đốc</option>
          <option value="Kế toán">Kế toán</option>
          <option value="Thủ kho">Thủ kho</option>
          <option value="Nhân viên Sale">Nhân viên Sale</option>
        </select>
      </div>
    </div>
  )
}

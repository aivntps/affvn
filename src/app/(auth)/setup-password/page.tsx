"use client"

import { setupPassword } from './actions'
import { Suspense, useActionState } from 'react'

function SetupPasswordForm() {
  const [state, formAction, isPending] = useActionState(setupPassword, null)

  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-sm text-left">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-600">Đổi mật khẩu</h1>
        <p className="text-sm text-gray-500 mt-2">Đây là lần đầu bạn đăng nhập, vui lòng thiết lập mật khẩu mới để bảo mật.</p>
      </div>
      
      <form className="space-y-4" action={formAction}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Mật khẩu mới</label>
          <input 
            id="password"
            name="password"
            type="password" 
            required
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Mật khẩu cực mạnh"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <input 
            id="confirmPassword"
            name="confirmPassword"
            type="password" 
            required
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nhập lại mật khẩu"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 mt-4">
            {state.error}
          </p>
        )}

        <button 
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-4 disabled:opacity-50"
        >
          {isPending ? 'Đang lưu...' : 'Hoàn tất thiết lập'}
        </button>
      </form>
    </div>
  )
}

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="text-gray-500">Đang tải...</div>}>
        <SetupPasswordForm />
      </Suspense>
    </div>
  )
}

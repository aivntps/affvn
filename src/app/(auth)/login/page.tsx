"use client"

import { login } from './actions'
import { Suspense, useActionState } from 'react'

function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-600">AFF System</h1>
        <p className="text-sm text-gray-500 mt-2">Đăng nhập hệ thống quản lý</p>
      </div>
      
      <form className="space-y-4" action={formAction}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Tài khoản đăng nhập</label>
          <input 
            id="email"
            name="email"
            type="text" 
            required
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ví dụ: admin hoặc ketoan01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Mật khẩu</label>
          <input 
            id="password"
            name="password"
            type="password" 
            required
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="••••••••"
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
          {isPending ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="text-gray-500">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

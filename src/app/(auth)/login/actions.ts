'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()

  // Lấy dữ liệu từ form
  const rawLogin = formData.get('email') as string
  const password = formData.get('password') as string
  let loginEmail = rawLogin

  // Nếu người dùng nhập tài khoản (không có @), tìm email tương ứng trong bảng hồ sơ
  if (!rawLogin.includes('@')) {
    const { data: profile } = await supabase
      .from('ho_so_nhan_vien')
      .select('email')
      .eq('tai_khoan', rawLogin)
      .single()
    
    if (profile?.email) {
      loginEmail = profile.email
    }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  })

  if (error) {
    return { error: 'Thông tin đăng nhập không chính xác hoặc tài khoản không tồn tại' }
  }

  // Kiểm tra nếu là lần đầu đăng nhập
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('ho_so_nhan_vien')
      .select('is_first_login')
      .eq('id', user.id)
      .single()
    
    if (profile?.is_first_login) {
      redirect('/setup-password')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/customers')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

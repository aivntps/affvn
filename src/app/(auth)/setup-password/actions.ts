'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function setupPassword(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Mật khẩu xác nhận không khớp' }
  }

  if (password.length < 6) {
    return { error: 'Mật khẩu phải có ít nhất 6 ký tự' }
  }

  // 1. Cập nhật mật khẩu Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Phiên làm việc hết hạn' }

  const { error: authErr } = await supabase.auth.updateUser({ password })
  if (authErr) return { error: authErr.message }

  // 2. Cập nhật hồ sơ
  const { error: profileErr } = await supabase
    .from('ho_so_nhan_vien')
    .update({ is_first_login: false })
    .eq('id', user.id)
  
  if (profileErr) return { error: profileErr.message }

  revalidatePath('/', 'layout')
  redirect('/customers')
}

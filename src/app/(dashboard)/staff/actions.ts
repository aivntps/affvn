'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Tạo Supabase Admin Client với khóa quản trị để thêm user ẩn danh mà không bị đăng xuất tài khoản Giám đốc
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Hàm kiểm tra quyền Giám đốc
async function checkIsAdmin() {
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('ho_so_nhan_vien')
    .select('vai_tro')
    .eq('id', user.id)
    .single()

  return profile?.vai_tro === 'Giám đốc'
}

export async function createStaff(formData: FormData) {
  if (!(await checkIsAdmin())) return { error: "Bạn không có quyền thực hiện việc này" }
  
  const tai_khoan = formData.get('tai_khoan') as string
  // Tự động sinh một email ảo cho Supabase hoạt động ở nền
  const email = tai_khoan.toLowerCase() + '@aff.vn'
  const password = '123456' // Mật khẩu mặc định là 123456
  const ho_ten = formData.get('ho_ten') as string
  const vai_tro = formData.get('vai_tro') as string
  const khu_vuc_quan_ly = formData.get('khu_vuc_quan_ly') as string || 'Tất cả khu vực'

  // Tạo người dùng trên hệ thống Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      tai_khoan,
      ho_ten,
      vai_tro,
      khu_vuc_quan_ly,
      is_first_login: true
    }
  })

  if (error) {
    console.error("Lỗi khi thêm nhân viên:", error)
    return { error: error.message }
  }

  // Cập nhật trạng thái lần đầu đăng nhập trong hồ sơ (nếu trigger chưa xử lý)
  await supabaseAdmin
    .from('ho_so_nhan_vien')
    .update({ is_first_login: true, khu_vuc_quan_ly })
    .eq('id', data.user.id)

  // Refresh danh sách
  revalidatePath('/staff')
  return { error: null }
}

export async function deleteStaff(id: string) {
  if (!(await checkIsAdmin())) return { error: "Bạn không có quyền thực hiện việc này" }

  // Xóa tài khoản trong Auth và Profile (Profile sẽ tự động bị xóa nếu có Cascade, hoặc xóa tay nếu chưa có)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  
  if (error) {
    console.error("Lỗi khi xóa nhân viên:", error)
    // Nếu lỗi FK, ta xóa Profile trước
    await supabaseAdmin.from('ho_so_nhan_vien').delete().eq('id', id)
    await supabaseAdmin.auth.admin.deleteUser(id)
  }

  revalidatePath('/staff')
  return { error: null }
}

export async function updateStaff(id: string, formData: FormData) {
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Bạn phải đăng nhập" }

  // Kiểm tra quyền: Nếu không phải Giám đốc thì CHỈ được sửa chính mình
  const { data: currentUserProfile } = await supabase
    .from('ho_so_nhan_vien')
    .select('vai_tro')
    .eq('id', user.id)
    .single()
  
  const isDirector = currentUserProfile?.vai_tro === 'Giám đốc'
  const isSelf = user.id === id

  if (!isDirector && !isSelf) {
    return { error: "Bạn không có quyền thực hiện việc này" }
  }

  const ho_ten = formData.get('ho_ten') as string
  const vai_tro = formData.get('vai_tro') as string
  const khu_vuc_quan_ly = formData.get('khu_vuc_quan_ly') as string
  const password = formData.get('password') as string

  // 1. Cập nhật hồ sơ trong database
  const { error: profileError } = await supabaseAdmin
    .from('ho_so_nhan_vien')
    .update({ ho_ten, vai_tro, ...(khu_vuc_quan_ly ? { khu_vuc_quan_ly } : {}) })
    .eq('id', id)

  if (profileError) return { error: profileError.message }

  // 2. Cập nhật mật khẩu nếu có nhập mới
  if (password && password.trim() !== '') {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: password
    })
    if (authError) return { error: authError.message }
  }

  // 3. Cập nhật metadata trong Auth
  await supabaseAdmin.auth.admin.updateUserById(id, {
    user_metadata: { ho_ten, vai_tro }
  })

  revalidatePath('/staff')
  return { error: null }
}

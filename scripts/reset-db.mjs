
import { createClient } from '@supabase/supabase-js'

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetAndSetup() {
  console.log('--- Kiểm tra dữ liệu hiện tại... ---')
  const { data: currentRows } = await supabase.from('ho_so_nhan_vien').select('*')
  console.log('Số dòng hồ sơ hiện tại:', currentRows?.length || 0)

  console.log('--- Đang dọn dẹp dữ liệu cũ (reset-db.mjs) ---')
  
  // 1. Xóa hồ sơ - dùng filter mạnh hơn
  const { error: delProfileErr } = await supabase
    .from('ho_so_nhan_vien')
    .delete()
    .filter('id', 'neq', '00000000-0000-0000-0000-000000000000')
  
  if (delProfileErr) console.error('Lỗi xóa hồ sơ:', delProfileErr)

  // 2. Xóa sạch users Auth
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) {
    console.error('Lỗi lấy user auth:', listErr)
  } else {
    await Promise.all(users.map(async (user) => {
      await supabase.auth.admin.deleteUser(user.id)
      console.log(`Đã xóa Auth user: ${user.email}`)
    }))
  }

  // Chờ 1 chút để DB đồng bộ
  await new Promise(r => setTimeout(r, 1000))

  console.log('--- Tạo tài khoản admin mặc định ---')
  
  // 3. Tạo lại admin với thông tin khác chút để tránh trùng lặp nếu còn rác
  const { data, error: createErr } = await supabase.auth.admin.createUser({
    email: 'admin_sys@aff.vn',
    password: 'admin',
    email_confirm: true,
    user_metadata: {
      tai_khoan: 'admin',
      ho_ten: 'Giám đốc',
      vai_tro: 'Giám đốc'
    }
  })

  if (createErr) {
    console.error('Lỗi tạo admin:', JSON.stringify(createErr, null, 2))
    
    console.log('--- THỬ LẦN 2 (Không có metadata) ---')
    const { data: data2, error: createErr2 } = await supabase.auth.admin.createUser({
      email: 'admin_plain@aff.vn',
      password: 'admin',
      email_confirm: true
    })
    
    if (createErr2) {
      console.error('Lần 2 vẫn lỗi:', createErr2.message)
    } else {
      console.log('Lần 2 thành công (Không metadata). Vậy lỗi ở Trigger!')
    }

  } else {
    console.log('--- THÀNH CÔNG! ---')
    console.log('Tài khoản: admin')
    console.log('Mật khẩu: admin')
  }
}

resetAndSetup()

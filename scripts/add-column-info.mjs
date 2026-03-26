
import { createClient } from '@supabase/supabase-js'

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function addColumn() {
  console.log('--- Đang thêm cột is_first_login ---')
  // Vì không có RPC chạy SQL, ta sẽ thử dùng query trực tiếp (nếu có thể) 
  // hoặc giả định anh sẽ chạy SQL này trong Dashboard
  
  console.log('Vui lòng chạy lệnh SQL sau trong Supabase Dashboard SQL Editor:')
  console.log('ALTER TABLE ho_so_nhan_vien ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE;')
}

addColumn()

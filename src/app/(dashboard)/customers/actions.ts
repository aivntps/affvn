'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivityAction } from '../inventory/actions'

export async function addCustomerAction(customerData: any) {
  try {
    const supabase = await createClient()
    
    // Auto-generate ID via RPC
    const { data: newId, error: seqErr } = await supabase.rpc('generate_next_customer_id')
    if (seqErr || !newId) {
      return { error: "Không thể tạo mã khách hàng mới" }
    }

    const dbCustomer = {
      id: newId,
      name: customerData.name,
      phone: customerData.phone,
      region: customerData.region,
      type: customerData.type,
      status: customerData.status,
      sales: 0
    }

    const { error } = await supabase.from('customers').insert(dbCustomer)
    
    if (error) {
      await logActivityAction(`Thêm mới khách hàng ${customerData.name}`, 'Thất bại')
      return { error: error.message }
    }

    await logActivityAction(`Thêm mới khách hàng ${customerData.name}`)
    revalidatePath('/customers')
    return { data: dbCustomer, error: null }
  } catch (err: any) {
    console.error("Lỗi try-catch addCustomerAction:", err)
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function updateCustomerAction(customerData: any) {
  try {
    const supabase = await createClient()
    
    const dbCustomer = {
      name: customerData.name,
      phone: customerData.phone,
      region: customerData.region,
      type: customerData.type,
      status: customerData.status,
    }

    const { error } = await supabase.from('customers').update(dbCustomer).eq('id', customerData.id)
    
    if (error) {
      await logActivityAction(`Sửa thông tin khách hàng ${customerData.name}`, 'Thất bại')
      return { error: error.message }
    }

    await logActivityAction(`Sửa thông tin khách hàng ${customerData.name}`)
    revalidatePath('/customers')
    return { error: null }
  } catch (err: any) {
    console.error("Lỗi try-catch updateCustomerAction:", err)
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function deleteCustomerAction(id: string, name: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.from('customers').delete().eq('id', id)
    
    if (error) {
      await logActivityAction(`Xóa khách hàng ${name}`, 'Thất bại')
      return { error: error.message }
    }

    await logActivityAction(`Xóa khách hàng ${name}`)
    revalidatePath('/customers')
    return { error: null }
  } catch (err: any) {
    console.error("Lỗi try-catch deleteCustomerAction:", err)
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

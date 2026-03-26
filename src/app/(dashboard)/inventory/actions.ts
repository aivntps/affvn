'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js' // Dùng cho Admin Cache
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

// Caching kho dữ liệu ít thay đổi (1 hour)
export const getCachedInventory = unstable_cache(
  async () => {
    // Dùng service role client cho cache chung toàn hệ thống để tránh vướng bận RLS cookie của từng user
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await supabaseAdmin.from('inventory')
      .select('sku, name, spec, storage_unit, conversion_rate, stock, price, retail_price, days_to_reorder, exp_date, status, inventory_batches(exp_date, qty)')
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data || []
  },
  ['inventory-data'],
  { revalidate: 3600, tags: ['inventory'] }
)

export async function updateSaleOrderStatus(orderId: string, newStatus: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('update_sale_order_status', {
      p_order_id: orderId,
      p_new_status: newStatus
    })
    
    if (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error)
      return { error: error.message }
    }
    
    if (data !== 'OK') {
       return { error: data }
    }
    
    revalidatePath('/orders')
    revalidatePath('/inventory')
    // @ts-expect-error - Next.js 15 types issue
    revalidateTag('inventory') // Revalidate cache ngay lập tức khi trạng thái giao hàng ảnh hưởng kho
    return { error: null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function receiveStockFromPO(poId: string, batches: any[]) {
  try {
    const supabase = await createClient()
    
    // Transform Frontend keys -> Database expected keys
    const formattedBatches = batches.map(b => ({
      sku: b.productId,
      expDate: b.expDate,
      qty: b.qty
    }));

    const { data, error } = await supabase.rpc('receive_stock_from_po', {
      p_po_id: poId,
      p_batches: formattedBatches
    })
    
    if (error) {
      console.error("Lỗi khi nhập kho:", error)
      return { error: error.message }
    }
    
    if (data !== 'OK') {
       return { error: data }
    }
    
    revalidatePath('/inventory')
    revalidatePath('/orders')
    // @ts-expect-error - Next.js 15 types issue
    revalidateTag('inventory') // Revalidate kho sau khi nhập
    return { error: null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function saveSaleOrderAction(order: any) {
  try {
    const supabase = await createClient()
    const dbOrder = {
        id: order.id, customer_id: order.customerId, customer_name: order.customerName,
        customer_type: order.customerType, customer_region: order.customerRegion,
        date: order.date, payment_date: order.paymentDate, total: order.total,
        status: order.status, staff_id: order.staffId, staff_name: order.staffName
    }
    const { error: err1 } = await supabase.from('sale_orders').upsert(dbOrder)
    if (err1) return { error: err1.message }
    
    await supabase.from('sale_order_items').delete().eq('so_id', order.id)
    if (order.items && order.items.length > 0) {
      const dbItems = order.items.map((i: any) => ({ so_id: order.id, product_id: i.productId, name: i.name, qty: i.qty, price: i.price }))
      const { error: err2 } = await supabase.from('sale_order_items').insert(dbItems)
      if (err2) return { error: err2.message }
    }
    return { error: null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function savePurchaseOrderAction(po: any) {
  try {
    const supabase = await createClient()
    const dbPo = { id: po.id, supplier: po.supplier, qty: po.qty, spec: po.spec, price: po.price, date: po.date, status: po.status }
    const { error: err1 } = await supabase.from('purchase_orders').upsert(dbPo)
    if (err1) return { error: err1.message }
    
    await supabase.from('po_items').delete().eq('po_id', po.id)
    if (po.items && po.items.length > 0) {
      const dbItems = po.items.map((i: any) => ({ po_id: po.id, product_id: i.productId, qty: i.qty, price: i.price }))
      const { error: err2 } = await supabase.from('po_items').insert(dbItems)
      if (err2) return { error: err2.message }
    }
    return { error: null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function addProductAction(p: any) {
  try {
    const supabase = await createClient()
    const dbP = { sku: p.sku, name: p.name, category: p.category, brand: p.brand, cost: p.cost, price: p.price, retail_price: p.retailPrice, stock: p.stock, spec: p.spec, status: p.status }
    const { error } = await supabase.from('inventory').insert(dbP)
    if (error) return { error: error.message }

    if (p.batches && p.batches.length > 0) {
      const dbB = p.batches.filter((b:any) => b.qty > 0).map((b: any) => ({ 
        sku: p.sku, 
        exp_date: b.expDate || null, 
        qty: b.qty 
      }))
      if (dbB.length > 0) {
        await supabase.from('inventory_batches').insert(dbB)
      }
    }

    return { error: null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function updateProductAction(p: any) {
  try {
    const supabase = await createClient()
    const dbP = { sku: p.sku, name: p.name, category: p.category, brand: p.brand, cost: p.cost, price: p.price, retail_price: p.retailPrice, stock: p.stock, spec: p.spec, status: p.status }
    const { error } = await supabase.from('inventory').update(dbP).eq('sku', p.sku)
    if (error) return { error: error.message }

    // Xóa các lô cũ và lưu lại các lô mới do người dùng chỉnh sửa tay
    await supabase.from('inventory_batches').delete().eq('sku', p.sku)
    if (p.batches && p.batches.length > 0) {
      // Chỉ lưu các lô có số lượng > 0 theo mặc định
      const dbB = p.batches.filter((b:any) => b.qty > 0).map((b: any) => ({ 
        sku: p.sku, 
        exp_date: b.expDate || null, 
        qty: b.qty 
      }))
      if (dbB.length > 0) {
        await supabase.from('inventory_batches').insert(dbB)
      }
    }

    return { error: null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function deleteProductAction(sku: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('inventory').delete().eq('sku', sku)
    if (!error) {
      // @ts-expect-error - Next.js 15 types issue
      revalidateTag('inventory')
    }
    return { error: error?.message || null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function addSupplierAction(s: any) {
  try {
    const supabase = await createClient()
    const dbS = { id: s.id, name: s.name, contact: s.contact, category: s.category, address: s.address, debt: s.debt, status: s.status }
    const { error } = await supabase.from('suppliers').insert(dbS)
    return { error: error?.message || null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function saveCompanyInfoAction(info: any) {
  try {
    const supabase = await createClient()
    const dbInfo = { 
      id: 1, 
      name: info.name, 
      tax_id: info.taxId, 
      address: info.address, 
      email: info.email, 
      phone: info.phone, 
      logo_url: info.logoUrl 
    }
    const { error } = await supabase.from('company_info').upsert(dbInfo)
    return { error: error?.message || null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

export async function saveInventoryConfigAction(config: any) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'inventory_config', value: config })
    return { error: error?.message || null }
  } catch (err: any) {
    console.error("Lỗi try-catch:", err);
    return { error: err.message || "Lỗi hệ thống không xác định" }
  }
}

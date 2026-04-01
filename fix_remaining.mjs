import fs from 'fs';

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const { from, to } of replacements) {
    if (content.includes(from)) {
      content = content.replace(from, to);
    } else {
      console.warn(`Could not find "${from.trim()}" in ${filePath}`);
    }
  }
  fs.writeFileSync(filePath, content);
}

replaceInFile('src/app/(dashboard)/debt/page.tsx', [
  {
    from: "const { data, error } = await supabase.rpc('get_company_financials_by_month', {",
    to: "const { data, error: _error } = await supabase.rpc('get_company_financials_by_month', {"
  },
  {
    from: "        // eslint-disable-next-line @typescript-eslint/no-explicit-any\n        if (data) {",
    to: "        if (data) {"
  },
  {
    from: "                    {detailInvoices.map((inv: any, idx: number) => (",
    to: "                    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n                    {detailInvoices.map((inv: any, idx: number) => ("
  }
]);

replaceInFile('src/app/(dashboard)/inventory/actions.ts', [
  {
    from: "    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n    return { success: false, error: (error as any).message || 'Lỗi hệ thống' };",
    to: "    return { success: false, error: (error as any).message || 'Lỗi hệ thống' };"
  },
  {
    from: "    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n    return { success: false, error: (error as any).message || 'Lỗi không xác định' };",
    to: "    return { success: false, error: (error as any).message || 'Lỗi không xác định' };"
  }
]);

replaceInFile('src/app/(dashboard)/inventory/components/SuppliersTab.tsx', [
  {
    from: "export function SuppliersTab({ suppliers, setIsAddingSupplier, setEditingSupplier }: SuppliersTabProps) {",
    to: "export function SuppliersTab({ suppliers, setIsAddingSupplier: _setIsAddingSupplier, setEditingSupplier }: SuppliersTabProps) {"
  }
]);

replaceInFile('src/app/(dashboard)/inventory/page.tsx', [
  {
    from: "  const [ordersLoading, setOrdersLoading] = useState(true);",
    to: "  const [_ordersLoading, setOrdersLoading] = useState(true);"
  }
]);

replaceInFile('src/app/(dashboard)/orders/components/CreateOrderModal.tsx', [
  {
    from: "  orders,\n",
    to: "  _orders,\n"
  }
]);

replaceInFile('src/app/(dashboard)/orders/components/OrderDetailModal.tsx', [
  {
    from: "  const { companyInfo, inventory } = useGlobalData();",
    to: "  const { inventory } = useGlobalData();"
  }
]);

replaceInFile('src/app/(dashboard)/orders/page.tsx', [
  {
    from: "  const [loading, setLoading] = useState(true);",
    to: "  const [_loading, setLoading] = useState(true);"
  }
]);

replaceInFile('src/lib/supabase/middleware.ts', [
  {
    from: "          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))",
    to: "          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))"
  }
]);

console.log('✅ Đã sửa nốt các lỗi Lint nhỏ lẻ.');

import { ClientLayout } from "@/components/layout/ClientLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { GlobalProvider } from "@/lib/store/GlobalContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Lấy thông vị hồ sơ nhân viên
  const { data: profile } = await supabase
    .from("ho_so_nhan_vien")
    .select("id, tai_khoan, ho_ten, vai_tro, khu_vuc_quan_ly")
    .eq("id", user.id)
    .single();

  return (
    <GlobalProvider>
      <ClientLayout user={profile}>
        {children}
      </ClientLayout>
    </GlobalProvider>
  );
}

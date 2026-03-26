CREATE TABLE IF NOT EXISTS public.app_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Bật Row Level Security nhưng cho phép mọi quyền (vì admin/staff sử dụng nội bộ)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép read tất cả" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Cho phép insert/update tất cả" ON public.app_settings FOR ALL USING (true);

-- Khởi tạo dữ liệu mẫu cho setting của kho hàng
INSERT INTO public.app_settings (key, value)
VALUES (
  'inventory_config', 
  '{"leadTimeAvg": 5, "leadTimeMax": 10, "maxCapacity": 10000, "minMoq": 100, "storageCost": 5000, "expWarningDays": 90}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

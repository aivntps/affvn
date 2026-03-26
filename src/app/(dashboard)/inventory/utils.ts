export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('VND', 'đ');
};

export const getRopColor = (days: number) => {
  if (days < 2) return "text-red-600 font-medium";
  if (days <= 7) return "text-orange-500 font-medium";
  return "text-green-600 font-medium";
};

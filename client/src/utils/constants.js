export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'completed',
  'cancelled',
];

export const ORDER_STATUS_LABELS = {
  pending: 'Ожидает подтверждения',
  paid: 'Оплачен',
  processing: 'В обработке',
  shipped: 'Передан в доставку',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

export const PRODUCT_SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Сначала новые' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'title-asc', label: 'По названию А-Я' },
  { value: 'popularity-desc', label: 'По популярности' },
];

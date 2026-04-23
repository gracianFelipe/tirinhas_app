export const ORDER_STATUS = {
  RECEIVED: 'Recebido na Cozinha',
  PREPARING: 'Em Preparo',
  READY: 'Pronto para Retirada',
  DELIVERED: 'Entregue',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  [ORDER_STATUS.RECEIVED]: ORDER_STATUS.PREPARING,
  [ORDER_STATUS.PREPARING]: ORDER_STATUS.READY,
  [ORDER_STATUS.READY]: ORDER_STATUS.DELIVERED,
  [ORDER_STATUS.DELIVERED]: null,
};

export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  [ORDER_STATUS.RECEIVED]: { bg: 'rgba(228, 156, 44, 0.2)', text: '#CD7522' },
  [ORDER_STATUS.PREPARING]: { bg: 'rgba(31, 60, 115, 0.15)', text: '#1F3C73' },
  [ORDER_STATUS.READY]: { bg: 'rgba(39, 174, 96, 0.2)', text: '#27ae60' },
  [ORDER_STATUS.DELIVERED]: { bg: 'rgba(107, 84, 70, 0.2)', text: '#6B5446' },
};

const FALLBACK_COLOR = { bg: 'rgba(107, 84, 70, 0.2)', text: '#6B5446' };

export function getStatusColor(status: string): { bg: string; text: string } {
  return STATUS_COLORS[status as OrderStatus] ?? FALLBACK_COLOR;
}

export function getNextStatus(status: string): OrderStatus | null {
  return NEXT_STATUS[status as OrderStatus] ?? null;
}

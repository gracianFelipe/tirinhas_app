export type LoyaltyTier = 'Escudeiro' | 'Cavaleiro' | 'Barão' | 'Rei';

export interface LoyaltyInfo {
  tier: LoyaltyTier;
  icon: string;
  progress: number; // 0 to 1
  ordersNeededForNext: number;
  currentEloOrders: number;
  stamps: number;
}

export const LOYALTY_CONFIG = {
  TIERS: [
    { name: 'Escudeiro' as LoyaltyTier, minOrders: 0, icon: '🛡️' },
    { name: 'Cavaleiro' as LoyaltyTier, minOrders: 5, icon: '⚔️' },
    { name: 'Barão' as LoyaltyTier, minOrders: 15, icon: '🏅' },
    { name: 'Rei' as LoyaltyTier, minOrders: 30, icon: '👑' },
  ],
  MAX_ELO_ORDERS: 30,
};

export function getLoyaltyInfo(totalDeliveredOrders: number): LoyaltyInfo {
  const stamps = Math.floor(totalDeliveredOrders / LOYALTY_CONFIG.MAX_ELO_ORDERS);
  const currentEloOrders = totalDeliveredOrders % LOYALTY_CONFIG.MAX_ELO_ORDERS;

  let currentTier = LOYALTY_CONFIG.TIERS[0];
  let nextTierMin = LOYALTY_CONFIG.MAX_ELO_ORDERS;

  for (let i = 0; i < LOYALTY_CONFIG.TIERS.length; i++) {
    if (currentEloOrders >= LOYALTY_CONFIG.TIERS[i].minOrders) {
      currentTier = LOYALTY_CONFIG.TIERS[i];
      const next = LOYALTY_CONFIG.TIERS[i + 1];
      nextTierMin = next ? next.minOrders : LOYALTY_CONFIG.MAX_ELO_ORDERS;
    }
  }

  const ordersNeededForNext = nextTierMin - currentEloOrders;
  
  // Calculate progress within the current range or towards the end of the elo
  const rangeStart = currentTier.minOrders;
  const rangeEnd = nextTierMin;
  const progress = (currentEloOrders - rangeStart) / (rangeEnd - rangeStart || 1);

  return {
    tier: currentTier.name,
    icon: currentTier.icon,
    progress: currentEloOrders / LOYALTY_CONFIG.MAX_ELO_ORDERS,
    ordersNeededForNext: Math.max(0, ordersNeededForNext),
    currentEloOrders,
    stamps,
  };
}

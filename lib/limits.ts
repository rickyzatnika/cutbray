export type Tier = "free" | "pro" | "ultra"

export interface TierLimit {
  label: string
  price: string
  priceId: string
  batchSize: number
  maxFileSizeMB: number
  dailyLimit: number
  highRes: boolean
}

export const TIER_LIMITS: Record<Tier, TierLimit> = {
  free: {
    label: "Free",
    price: "Rp0",
    priceId: "free",
    batchSize: 5,
    maxFileSizeMB: 10,
    dailyLimit: 10,
    highRes: false,
  },
  pro: {
    label: "Pro",
    price: "Rp29.000",
    priceId: "pro",
    batchSize: 20,
    maxFileSizeMB: 50,
    dailyLimit: 100,
    highRes: true,
  },
  ultra: {
    label: "Ultra",
    price: "Rp59.000",
    priceId: "ultra",
    batchSize: 100,
    maxFileSizeMB: 1024,
    dailyLimit: Infinity,
    highRes: true,
  },
}

export function formatPrice(price: string): string {
  return `${price}/bulan`
}

export const TIER_COLORS: Record<Tier, string> = {
  free: "text-muted-foreground",
  pro: "text-blue-500",
  ultra: "text-amber-500",
}

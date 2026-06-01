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
    maxFileSizeMB: 5,
    dailyLimit: Infinity,
    highRes: false,
  },
  pro: {
    label: "Pro",
    price: "Rp15.000",
    priceId: "pro",
    batchSize: 20,
    maxFileSizeMB: 50,
    dailyLimit: Infinity,
    highRes: true,
  },
  ultra: {
    label: "Ultra",
    price: "Rp30.000",
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

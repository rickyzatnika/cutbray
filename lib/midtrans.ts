import { TIER_LIMITS, type Tier } from "@/lib/limits"

const PRICES: Record<string, number> = {
  pro: 29000,
  ultra: 59000,
}

export function isMidtransConfigured(): boolean {
  return !!(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY)
}

export function getPrice(tier: Tier): number {
  return PRICES[tier] || 0
}

// Demo mode — simulasi payment tanpa Midtrans
export function demoPayment(): { success: boolean; transactionId: string } {
  return {
    success: true,
    transactionId: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
  }
}

// Midtrans Snap — create transaction token
export async function createMidtransTransaction(params: {
  orderId: string
  grossAmount: number
  customerName: string
  customerEmail: string
  tier: string
}) {
  const Midtrans = require("midtrans-client")

  const snap = new Midtrans.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  })

  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    item_details: [
      {
        id: params.tier,
        price: params.grossAmount,
        quantity: 1,
        name: `Squish ${params.tier.charAt(0).toUpperCase() + params.tier.slice(1)} - ${params.grossAmount === 29000 ? "Bulanan" : "Bulanan"}`,
      },
    ],
  })

  return transaction
}

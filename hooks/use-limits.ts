"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { TIER_LIMITS, type Tier, type TierLimit } from "@/lib/limits"

interface UsageData {
  date: string
  count: number
}

interface LimitsData {
  tier: Tier
  limits: TierLimit
  usage: UsageData
  paymentVerified: boolean
  loading: boolean
}

export function useLimits(): LimitsData {
  const { data: session, status } = useSession()
  const [data, setData] = useState<LimitsData>({
    tier: "free",
    limits: TIER_LIMITS.free,
    usage: { date: "", count: 0 },
    paymentVerified: false,
    loading: true,
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      setData({
        tier: "free",
        limits: TIER_LIMITS.free,
        usage: { date: "", count: 0 },
        paymentVerified: false,
        loading: false,
      })
      return
    }

    fetch("/api/user/limits")
      .then(res => res.json())
      .then(json => {
        setData({
          tier: json.tier,
          limits: json.limits,
          usage: json.usage,
          paymentVerified: json.paymentVerified,
          loading: false,
        })
      })
      .catch(() => {
        setData(prev => ({ ...prev, loading: false }))
      })
  }, [session, status])

  return data
}



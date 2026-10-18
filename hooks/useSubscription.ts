'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { hasPaidAccess } from '@/lib/stripe-access'
import { useAuth } from '@/hooks/useAuth'

type Profile = {
  subscription_status: string | null
  stripe_customer_id: string | null
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [billingEnabled, setBillingEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (authLoading) return

      const statusRes = await fetch('/api/billing/status', { cache: 'no-store' })
      const statusJson = (await statusRes.json().catch(() => ({}))) as {
        enabled?: boolean
      }
      const enabled = Boolean(statusJson.enabled)

      if (!mounted) return
      setBillingEnabled(enabled)

      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      if (!enabled) {
        setProfile({ subscription_status: 'active', stripe_customer_id: null })
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!mounted) return
      setProfile(
        (data as Profile) || {
          subscription_status: 'inactive',
          stripe_customer_id: null,
        }
      )
      setLoading(false)
    }

    void load()
    return () => {
      mounted = false
    }
  }, [user, authLoading])

  return {
    loading: authLoading || loading,
    billingEnabled,
    status: profile?.subscription_status || 'inactive',
    hasAccess: !billingEnabled || hasPaidAccess(profile?.subscription_status),
    customerId: profile?.stripe_customer_id || null,
  }
}

export async function startCheckout() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not signed in')

  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !json.url) {
    throw new Error(json.error || 'Checkout failed')
  }
  window.location.href = json.url
}

export async function openBillingPortal() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not signed in')

  const response = await fetch('/api/stripe/portal', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !json.url) {
    throw new Error(json.error || 'Portal failed')
  }
  window.location.href = json.url
}

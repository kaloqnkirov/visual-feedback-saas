'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useSubscription() {
  const { user, loading: authLoading } = useAuth()
  const [billingEnabled, setBillingEnabled] = useState(false)
  const [hasAccess, setHasAccess] = useState(true)
  const [status, setStatus] = useState('inactive')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (authLoading) return

      const headers: HeadersInit = {}
      if (user) {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (token) headers.Authorization = `Bearer ${token}`
      }

      const statusRes = await fetch('/api/billing/status', {
        cache: 'no-store',
        headers,
      })
      const json = (await statusRes.json().catch(() => ({}))) as {
        enabled?: boolean
        hasAccess?: boolean
        status?: string
        isAdmin?: boolean
      }

      if (!mounted) return
      setBillingEnabled(Boolean(json.enabled))
      setHasAccess(json.hasAccess !== false)
      setStatus(json.status || 'inactive')
      setIsAdmin(Boolean(json.isAdmin))
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
    status,
    hasAccess,
    isAdmin,
    customerId: null as string | null,
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Loader2, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  openBillingPortal,
  startCheckout,
  useSubscription,
} from '@/hooks/useSubscription'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useT } from '@/lib/i18n/context'

export default function BillingPage() {
  const router = useRouter()
  const t = useT()
  const { user, loading: authLoading, signOut } = useAuth()
  const { loading, billingEnabled, hasAccess, status } = useSubscription()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Billing error')
      setBusy(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => void signOut().then(() => router.replace('/login'))}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t('signOut')}
        </button>
      </div>

      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          {t('appName')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Абонамент</h1>
        <p className="mt-2 text-sm text-slate-400">
          Плати абонамент, за да ползваш таблото и да създаваш проекти за
          клиентите си.
        </p>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm">
          <p className="text-slate-400">Статус</p>
          <p className="mt-1 font-medium text-white">
            {hasAccess ? 'Активен достъп' : 'Няма активен абонамент'}
            <span className="ml-2 text-xs text-slate-500">({status})</span>
          </p>
        </div>

        {!billingEnabled && (
          <p className="mt-4 text-sm text-amber-300">
            Stripe още не е включен. Добави ключовете в Vercel (виж инструкциите)
            и сложи NEXT_PUBLIC_BILLING_ENABLED=true.
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 space-y-3">
          {billingEnabled && !hasAccess && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(startCheckout)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {busy ? 'Моля изчакай…' : 'Абонирай се със Stripe'}
            </button>
          )}

          {billingEnabled && hasAccess && (
            <>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-400"
              >
                Към таблото
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(openBillingPortal)}
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                Управлявай абонамента
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

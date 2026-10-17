'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LogIn, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useT } from '@/lib/i18n/context'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useT()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const requested = searchParams.get('mode')
    if (requested === 'login' || requested === 'signin') {
      setMode('login')
    } else if (requested === 'signup' || requested === 'register') {
      setMode('signup')
    }
  }, [searchParams])

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next)
    setError('')
    setInfo('')
    router.replace(next === 'signup' ? '/login?mode=signup' : '/login?mode=login')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) {
          if (signInError.message.toLowerCase().includes('invalid login')) {
            setMode('signup')
            router.replace('/login?mode=signup')
            throw new Error(
              'Няма такъв акаунт. Попълни същото и натисни синия бутон „Създай акаунт“.'
            )
          }
          throw signInError
        }
        router.replace('/dashboard')
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() || email.trim() },
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/dashboard`
              : undefined,
        },
      })
      if (signUpError) throw signUpError

      if (data.session) {
        router.replace('/dashboard')
        return
      }

      setInfo(t('checkEmail'))
      setMode('login')
      router.replace('/login?mode=login')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('authFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          {t('appName')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          {mode === 'login' ? t('signIn') : t('signUp')}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{t('authSubtitle')}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'signup'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('signUp')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === 'login'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('signIn')}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {info && <p className="mt-4 text-sm text-emerald-400">{info}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t('displayName')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('email')}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('passwordHint')}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
          >
            {mode === 'login' ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading
              ? t('pleaseWait')
              : mode === 'login'
                ? t('signIn')
                : t('signUp')}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          {mode === 'signup'
            ? 'Първи път тук? Избери „Създай акаунт“, после същите данни за вход.'
            : 'Ако нямаш акаунт, избери таба „Създай акаунт“ горе.'}
        </p>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <Link href="/guide" className="text-sky-400 hover:text-sky-300">
            {t('userGuide')}
          </Link>
          <Link
            href="/dashboard"
            className="text-slate-500 hover:text-slate-300"
          >
            {t('continueDashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

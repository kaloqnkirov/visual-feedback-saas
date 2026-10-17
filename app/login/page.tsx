'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useT } from '@/lib/i18n/context'

export default function LoginPage() {
  const router = useRouter()
  const t = useT()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

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
        if (signInError) throw signInError
        router.replace('/dashboard')
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() || email.trim() },
        },
      })
      if (signUpError) throw signUpError

      if (data.session) {
        router.replace('/dashboard')
        return
      }

      setInfo(t('checkEmail'))
      setMode('login')
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-60"
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

        <button
          type="button"
          onClick={() => {
            setMode((current) => (current === 'login' ? 'signup' : 'login'))
            setError('')
            setInfo('')
          }}
          className="mt-4 w-full text-center text-sm text-sky-400 hover:text-sky-300"
        >
          {mode === 'login' ? t('needAccount') : t('haveAccount')}
        </button>

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

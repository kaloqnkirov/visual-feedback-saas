'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useT } from '@/lib/i18n/context'

export default function LoginPage() {
  const router = useRouter()
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError) {
        if (signInError.message.toLowerCase().includes('invalid login')) {
          throw new Error(
            'Няма такъв акаунт. Отвори „Създай акаунт“ и се регистрирай първо.'
          )
        }
        throw signInError
      }
      // Billing gate decides dashboard vs /billing
      router.replace('/dashboard')
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
        <h1 className="mt-1 text-2xl font-semibold text-white">{t('signIn')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t('authSubtitle')}</p>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('email')}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
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
            <LogIn className="h-4 w-4" />
            {loading ? t('pleaseWait') : t('signIn')}
          </button>
        </form>

        <a
          href="/signup"
          className="mt-4 flex w-full items-center justify-center rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-300 hover:bg-sky-500/20"
        >
          {t('signUp')}
        </a>

        <p className="mt-3 text-center text-xs text-slate-500">
          Ако нямаш акаунт, натисни синия бутон „Създай акаунт“ по-горе.
        </p>

        <div className="mt-3 text-center text-xs">
          <a href="/guide" className="text-sky-400 hover:text-sky-300">
            {t('userGuide')}
          </a>
        </div>
      </div>
    </div>
  )
}

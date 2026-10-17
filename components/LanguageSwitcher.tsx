'use client'

import { Languages } from 'lucide-react'
import { LOCALES } from '@/lib/i18n/languages'
import { useI18n } from '@/lib/i18n/context'

type Props = {
  compact?: boolean
  className?: string
}

export function LanguageSwitcher({ compact = false, className = '' }: Props) {
  const { locale, setLocale, t } = useI18n()

  return (
    <label
      className={`inline-flex items-center gap-2 text-xs text-slate-400 ${className}`}
    >
      <Languages className="h-3.5 w-3.5 shrink-0 text-sky-400" />
      {!compact && <span className="hidden sm:inline">{t('language')}</span>}
      <select
        value={locale}
        onChange={(event) =>
          setLocale(event.target.value as (typeof LOCALES)[number]['code'])
        }
        aria-label={t('language')}
        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none ring-sky-500 focus:ring-2"
      >
        {LOCALES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )
}

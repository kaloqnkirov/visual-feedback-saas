'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { GUIDE_BY_LANG, type GuideLang } from '@/lib/guide-content'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useI18n, useT } from '@/lib/i18n/context'

export default function GuidePage() {
  const { locale, dir } = useI18n()
  const t = useT()
  const doc = useMemo(
    () => GUIDE_BY_LANG[locale as GuideLang] ?? GUIDE_BY_LANG.en,
    [locale]
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir={dir}>
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sky-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                {t('appName')}
              </p>
              <h1 className="text-xl font-semibold text-white">{doc.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToDashboard')}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-base leading-relaxed text-slate-300">{doc.intro}</p>

        <div className="mt-8 space-y-6">
          {doc.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <h2 className="text-lg font-semibold text-white">
                {section.title}
              </h2>
              <ul className="mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed text-slate-300">
                {section.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

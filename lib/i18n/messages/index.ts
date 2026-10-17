import type { Locale } from '../languages'
import { en, type MessageKey } from './en'
import { bg } from './bg'
import { es } from './es'
import { de } from './de'
import { fr } from './fr'
import { pt } from './pt'
import { zh } from './zh'
import { ru } from './ru'
import { ar } from './ar'
import { ja } from './ja'

export type { MessageKey }

export const messages: Record<Locale, Record<MessageKey, string>> = {
  en,
  bg,
  es,
  de,
  fr,
  pt,
  zh,
  ru,
  ar,
  ja,
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>
) {
  const template = messages[locale]?.[key] ?? messages.en[key] ?? key
  if (!vars) return template
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template
  )
}

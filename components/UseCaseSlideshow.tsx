'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  FileText,
  Globe2,
  ImageIcon,
  LayoutTemplate,
  Smartphone,
  Video,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

type Slide = {
  id: string
  title: string
  subtitle: string
  image: string
  icon: typeof Globe2
}

const slidesEn: Slide[] = [
  {
    id: 'web',
    title: 'Websites',
    subtitle: 'Mark issues on full-page site captures',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
    icon: Globe2,
  },
  {
    id: 'ui',
    title: 'UI & mockups',
    subtitle: 'Pin exact notes on design drafts',
    image:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1400&q=80',
    icon: LayoutTemplate,
  },
  {
    id: 'pdf',
    title: 'PDFs & docs',
    subtitle: 'Review proposals, contracts, and print files',
    image:
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1400&q=80',
    icon: FileText,
  },
  {
    id: 'video',
    title: 'Video & media',
    subtitle: 'Leave feedback on creative deliverables',
    image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1400&q=80',
    icon: Video,
  },
  {
    id: 'mobile',
    title: 'Mobile apps',
    subtitle: 'Share review links for app screens',
    image:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&q=80',
    icon: Smartphone,
  },
  {
    id: 'photos',
    title: 'Images & photos',
    subtitle: 'Highlight crops, colors, and retouch notes',
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1400&q=80',
    icon: ImageIcon,
  },
]

const slidesBg: Slide[] = [
  {
    ...slidesEn[0],
    title: 'Уебсайтове',
    subtitle: 'Маркирай проблеми върху цяла страница',
  },
  {
    ...slidesEn[1],
    title: 'UI и макети',
    subtitle: 'Точни бележки върху дизайна',
  },
  {
    ...slidesEn[2],
    title: 'PDF и документи',
    subtitle: 'Преглед на оферти, договори и файлове',
  },
  {
    ...slidesEn[3],
    title: 'Видео и медия',
    subtitle: 'Обратна връзка по креативни материали',
  },
  {
    ...slidesEn[4],
    title: 'Мобилни приложения',
    subtitle: 'Споделяй екрани за ревю с клиенти',
  },
  {
    ...slidesEn[5],
    title: 'Снимки и изображения',
    subtitle: 'Отбелязвай корекции по визуала',
  },
]

export function UseCaseSlideshow() {
  const { locale } = useI18n()
  const slides = locale === 'bg' ? slidesBg : slidesEn
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 3800)
    return () => window.clearInterval(timer)
  }, [paused, slides.length])

  const active = slides[index]
  const Icon = active.icon

  return (
    <section
      className="relative mb-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="ProofFlow use cases"
    >
      <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
        {slides.map((slide, slideIndex) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              slideIndex === index ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={slideIndex !== index}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={slideIndex === 0}
              sizes="(max-width: 768px) 100vw, 640px"
              className={`object-cover transition-transform duration-[4000ms] ease-out ${
                slideIndex === index ? 'scale-105' : 'scale-100'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/20" />
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sky-300">
            <Icon className="h-4 w-4 animate-pulse" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
              ProofFlow
            </p>
          </div>
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            {active.title}
          </h2>
          <p className="mt-1 max-w-md text-sm text-slate-300">{active.subtitle}</p>

          <div className="mt-4 flex items-center gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={slide.title}
                onClick={() => setIndex(slideIndex)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === index
                    ? 'w-7 bg-sky-400'
                    : 'w-2.5 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

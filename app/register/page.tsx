'use client'

import { useEffect } from 'react'

export default function RegisterPage() {
  useEffect(() => {
    window.location.replace('/signup')
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
      <a href="/signup" className="text-sky-400">
        Създай акаунт →
      </a>
    </div>
  )
}

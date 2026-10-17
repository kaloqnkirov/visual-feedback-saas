'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FolderOpen as FolderCanvas,
  LogOut,
  Plus,
  Upload,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { AppNotification, Project, ShareMode } from '@/lib/types'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useI18n, useT } from '@/lib/i18n/context'

export default function DashboardPage() {
  const router = useRouter()
  const t = useT()
  const { dir, locale } = useI18n()
  const { user, loading: authLoading, signOut } = useAuth()

  const [projects, setProjects] = useState<Project[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [assetUrl, setAssetUrl] = useState('')
  const [assetFile, setAssetFile] = useState<File | null>(null)
  const [shareMode, setShareMode] = useState<ShareMode>('comment')
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  const fetchProjects = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setProjects([])
      setLoading(false)
      return
    }

    setProjects((data as Project[]) ?? [])
    setLoading(false)
  }, [user])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications((data as AppNotification[]) ?? [])
  }, [user])

  useEffect(() => {
    fetchProjects()
    fetchNotifications()
  }, [fetchProjects, fetchNotifications])

  const resetForm = () => {
    setTitle('')
    setAssetUrl('')
    setAssetFile(null)
    setShareMode('comment')
    setErrorMsg('')
    setModalOpen(false)
  }

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return
    if (!title.trim() || (!assetUrl.trim() && !assetFile)) {
      setErrorMsg(t('addAssetRequired'))
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      let finalAssetUrl = assetUrl.trim()

      if (assetFile) {
        const safeName = assetFile.name.replace(/[^\w.\-()+ ]+/g, '_')
        const path = `projects/${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(path, assetFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: assetFile.type || undefined,
          })

        if (uploadError) {
          setErrorMsg(uploadError.message)
          return
        }

        finalAssetUrl = supabase.storage
          .from('attachments')
          .getPublicUrl(path).data.publicUrl
      }

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          title: title.trim(),
          asset_url: finalAssetUrl,
          owner_id: user.id,
          share_mode: shareMode,
        })
        .select()
        .single()

      if (insertError) {
        setErrorMsg(insertError.message)
        return
      }

      const project = data as Project

      await supabase.from('project_versions').insert({
        project_id: project.id,
        asset_url: finalAssetUrl,
        label: 'v1',
      })

      setProjects((prev) => [project, ...prev])
      resetForm()
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : t('failedCreateProject')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const updateShareMode = async (projectId: string, mode: ShareMode) => {
    const { error: updateError } = await supabase
      .from('projects')
      .update({ share_mode: mode })
      .eq('id', projectId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, share_mode: mode } : project
      )
    )
  }

  const copyShareUrl = async (projectId: string) => {
    const url = `${window.location.origin}/project/${projectId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(projectId)
      window.setTimeout(() => {
        setCopiedId((current) => (current === projectId ? null : current))
      }, 2000)
    } catch {
      setError(t('copyFailed'))
    }
  }

  const markNotificationsRead = async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    fetchNotifications()
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        {t('loading')}
      </div>
    )
  }

  const unread = notifications.filter((item) => !item.read).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" dir={dir}>
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sky-400">
              <FolderCanvas className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                {t('appName')}
              </p>
              <h1 className="text-xl font-semibold text-white">
                {t('dashboard')}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher compact />
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((open) => !open)
                  if (!showNotifications) markNotificationsRead()
                }}
                className="relative rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 hover:bg-slate-800"
                aria-label={t('notifications')}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute end-0 z-20 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {t('notifications')}
                  </p>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      {t('noNotifications')}
                    </p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300"
                        >
                          {item.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="hidden text-sm text-slate-400 sm:block">
              {user.email}
            </p>
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              <BookOpen className="h-4 w-4" />
              {t('guide')}
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut()
                router.replace('/login')
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg('')
                setModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              {t('newProject')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-16 text-center text-slate-400">
            {t('loadingProjects')}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
            <FolderCanvas className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-lg font-medium text-white">{t('noProjectsYet')}</p>
            <p className="mt-1 text-sm text-slate-400">{t('noProjectsHint')}</p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              {t('createProject')}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {project.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {project.created_at
                        ? formatDate(project.created_at)
                        : t('recentlyCreated')}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-sky-400">
                    <FolderCanvas className="h-4 w-4" />
                  </div>
                </div>

                <label className="mb-3 block text-xs text-slate-400">
                  {t('sharePermission')}
                  <select
                    value={project.share_mode ?? 'comment'}
                    onChange={(event) =>
                      updateShareMode(
                        project.id,
                        event.target.value as ShareMode
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="comment">{t('canComment')}</option>
                    <option value="view">{t('viewOnly')}</option>
                  </select>
                </label>

                <div className="mt-auto flex flex-col gap-2">
                  <Link
                    href={`/project/${project.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('openProject')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => copyShareUrl(project.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                  >
                    {copiedId === project.id ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        {t('copyShareLink')}
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-2">
              <Plus className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">
                {t('newProject')}
              </h2>
            </div>

            {errorMsg && (
              <p className="mb-4 text-sm text-red-400">{errorMsg}</p>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label
                  htmlFor="project-title"
                  className="mb-1.5 block text-sm text-slate-300"
                >
                  {t('projectTitle')}
                </label>
                <input
                  id="project-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t('projectTitlePlaceholder')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-sky-500 placeholder:text-slate-500 focus:ring-2"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="asset-url"
                  className="mb-1.5 block text-sm text-slate-300"
                >
                  {t('assetUrlOptional')}
                </label>
                <input
                  id="asset-url"
                  type="url"
                  value={assetUrl}
                  onChange={(event) => setAssetUrl(event.target.value)}
                  placeholder={t('assetUrlPlaceholder')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-sky-500 placeholder:text-slate-500 focus:ring-2"
                />
              </div>

              <div>
                <label
                  htmlFor="asset-file"
                  className="mb-1.5 flex items-center gap-2 text-sm text-slate-300"
                >
                  <Upload className="h-4 w-4 text-sky-400" />
                  {t('orUploadFile')}
                </label>
                <input
                  id="asset-file"
                  type="file"
                  onChange={(event) =>
                    setAssetFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700"
                />
                <p className="mt-1.5 text-xs text-slate-500">{t('assetHelp')}</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  {t('clientSharePermission')}
                </label>
                <select
                  value={shareMode}
                  onChange={(event) =>
                    setShareMode(event.target.value as ShareMode)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                >
                  <option value="comment">{t('canComment')}</option>
                  <option value="view">{t('viewOnly')}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {submitting ? t('creating') : t('createProject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

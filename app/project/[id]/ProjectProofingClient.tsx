'use client'

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle,
  Clock,
  Download,
  FileUp,
  Link2,
  MessageSquarePlus,
  Paperclip,
  Plus,
  Search,
  Send,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  assetKindLabel,
  getAssetKind,
  getRenderableAssetUrl,
  type AssetKind,
} from '@/lib/assets'
import { exportPinsToCsv } from '@/lib/export'
import { useAuth } from '@/hooks/useAuth'
import type { Pin, PinReply, Project, ProjectVersion, ShareMode } from '@/lib/types'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useI18n, useT } from '@/lib/i18n/context'

type DraftPin = {
  x_percent: number
  y_percent: number
  width_percent: number
  height_percent: number
}

type DragState = {
  startX: number
  startY: number
  currentX: number
  currentY: number
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value))
}

function normalizeRegion(
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  const x1 = clampPercent(Math.min(startX, endX))
  const y1 = clampPercent(Math.min(startY, endY))
  const x2 = clampPercent(Math.max(startX, endX))
  const y2 = clampPercent(Math.max(startY, endY))
  return {
    x_percent: x1,
    y_percent: y1,
    width_percent: Math.max(x2 - x1, 0),
    height_percent: Math.max(y2 - y1, 0),
  }
}

function isRegionPin(pin: {
  width_percent?: number | null
  height_percent?: number | null
}) {
  return (pin.width_percent ?? 0) > 0.8 && (pin.height_percent ?? 0) > 0.8
}

const POINT_THRESHOLD = 1.2

async function uploadAttachment(file: File, folder: string) {
  const safeName = file.name.replace(/[^\w.\-()+ ]+/g, '_')
  const path = `${folder}/${Date.now()}-${safeName}`
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('attachments').getPublicUrl(path)
  return { url: data.publicUrl, name: file.name }
}

export default function ProjectProofingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = use(params)
  const { user } = useAuth()
  const t = useT()
  const { dir } = useI18n()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const versionInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const liveOverlayRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const resizeRef = useRef<{
    corner: 'nw' | 'ne' | 'sw' | 'se'
    origin: DraftPin
  } | null>(null)
  const rafRef = useRef<number | null>(null)
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null
  )

  const [project, setProject] = useState<Project | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [replies, setReplies] = useState<PinReply[]>([])
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [activeAssetUrl, setActiveAssetUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assetFailed, setAssetFailed] = useState(false)
  const [, setAssetLoading] = useState(true)

  const [draft, setDraft] = useState<DraftPin | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [author, setAuthor] = useState('')
  const [comment, setComment] = useState('')
  const [changeDetail, setChangeDetail] = useState('')
  const [detailExpanded, setDetailExpanded] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>(
    'all'
  )
  const [search, setSearch] = useState('')
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyAuthor, setReplyAuthor] = useState('')

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [spaceDown, setSpaceDown] = useState(false)

  const fetchData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)

    // RPCs: share links work, but freelancers cannot list each other's projects
    const [projectRes, pinsRes, versionsRes] = await Promise.all([
      supabase.rpc('get_shared_project', { p_id: projectId }),
      supabase.rpc('get_shared_pins', { p_project_id: projectId }),
      supabase.rpc('get_shared_versions', { p_project_id: projectId }),
    ])

    if (projectRes.error) {
      setError(projectRes.error.message)
      setProject(null)
      setLoading(false)
      return
    }

    if (pinsRes.error) {
      setError(pinsRes.error.message)
      setLoading(false)
      return
    }

    const projectRows = (projectRes.data as Project[]) ?? []
    const nextProject = projectRows[0]
    if (!nextProject) {
      setError('Project not found')
      setProject(null)
      setLoading(false)
      return
    }

    const nextPins = (pinsRes.data as Pin[]) ?? []
    setProject(nextProject)
    setPins(nextPins)
    setVersions((versionsRes.data as ProjectVersion[]) ?? [])
    setActiveAssetUrl(nextProject.asset_url)
    setAssetFailed(false)
    setAssetLoading(true)

    if (nextPins.length) {
      const { data: replyData } = await supabase.rpc('get_shared_replies', {
        p_pin_ids: nextPins.map((pin) => pin.id),
      })
      setReplies((replyData as PinReply[]) ?? [])
    } else {
      setReplies([])
    }

    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const name =
      (user?.user_metadata?.display_name as string | undefined) ||
      user?.email?.split('@')[0] ||
      ''
    if (name) {
      setAuthor((current) => current || name)
      setReplyAuthor((current) => current || name)
    }
  }, [user])

  const shareMode: ShareMode = project?.share_mode === 'view' ? 'view' : 'comment'
  const canComment = shareMode === 'comment'
  const isOwner = Boolean(user && project?.owner_id && user.id === project.owner_id)

  const assetKind: AssetKind | null = useMemo(
    () => (activeAssetUrl ? getAssetKind(activeAssetUrl) : null),
    [activeAssetUrl]
  )

  const renderableAssetUrl = useMemo(
    () => (activeAssetUrl ? getRenderableAssetUrl(activeAssetUrl) : ''),
    [activeAssetUrl]
  )

  useEffect(() => {
    if (assetKind === 'file') setAssetLoading(false)
  }, [assetKind])

  const filteredPins = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pins.filter((pin) => {
      if (statusFilter !== 'all' && pin.status !== statusFilter) return false
      if (!q) return true
      return (
        pin.author.toLowerCase().includes(q) ||
        pin.comment.toLowerCase().includes(q) ||
        (pin.change_detail ?? '').toLowerCase().includes(q)
      )
    })
  }, [pins, search, statusFilter])

  const resetDraftForm = () => {
    setDraft(null)
    dragRef.current = null
    resizeRef.current = null
    setIsDrawing(false)
    setComment('')
    setChangeDetail('')
    setDetailExpanded(false)
    setAttachmentFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (liveOverlayRef.current) liveOverlayRef.current.style.display = 'none'
  }

  const pointerToPercent = useCallback((clientX: number, clientY: number) => {
    const el = canvasRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    return {
      x: clampPercent(((clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((clientY - rect.top) / rect.height) * 100),
    }
  }, [])

  const paintLiveOverlay = useCallback((region: DraftPin | null) => {
    const node = liveOverlayRef.current
    if (!node) return
    if (!region || !isRegionPin(region)) {
      node.style.display = 'none'
      return
    }
    node.style.display = 'block'
    node.style.left = `${region.x_percent}%`
    node.style.top = `${region.y_percent}%`
    node.style.width = `${region.width_percent}%`
    node.style.height = `${region.height_percent}%`
  }, [])

  const scheduleLivePaint = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      const drag = dragRef.current
      if (!drag) return
      paintLiveOverlay(
        normalizeRegion(drag.startX, drag.startY, drag.currentX, drag.currentY)
      )
    })
  }, [paintLiveOverlay])

  const finishDrawing = useCallback(
    (clientX: number, clientY: number) => {
      const drag = dragRef.current
      dragRef.current = null
      setIsDrawing(false)
      if (!drag) return

      const point = pointerToPercent(clientX, clientY)
      const region = normalizeRegion(
        drag.startX,
        drag.startY,
        point?.x ?? drag.currentX,
        point?.y ?? drag.currentY
      )

      const nextDraft: DraftPin =
        region.width_percent < POINT_THRESHOLD ||
        region.height_percent < POINT_THRESHOLD
          ? {
              x_percent: region.x_percent,
              y_percent: region.y_percent,
              width_percent: 0,
              height_percent: 0,
            }
          : region

      paintLiveOverlay(null)
      setDraft(nextDraft)
      setDetailExpanded(true)
    },
    [paintLiveOverlay, pointerToPercent, setDetailExpanded]
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canComment) return
    if (spaceDown || event.button === 1) {
      panRef.current = {
        x: pan.x,
        y: pan.y,
        px: event.clientX,
        py: event.clientY,
      }
      const onMove = (moveEvent: PointerEvent) => {
        if (!panRef.current) return
        setPan({
          x: panRef.current.x + (moveEvent.clientX - panRef.current.px),
          y: panRef.current.y + (moveEvent.clientY - panRef.current.py),
        })
      }
      const onUp = () => {
        panRef.current = null
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      return
    }

    if ((event.target as HTMLElement).closest('[data-resize-handle]')) return
    if ((event.target as HTMLElement).closest('[data-pin-marker]')) return
    if (
      (event.target as HTMLElement).closest(
        'a, button, input, textarea, video, audio, select'
      )
    ) {
      return
    }

    const point = pointerToPercent(event.clientX, event.clientY)
    if (!point) return
    event.preventDefault()
    setDraft(null)
    dragRef.current = {
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
    }
    setIsDrawing(true)

    const onMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return
      const next = pointerToPercent(moveEvent.clientX, moveEvent.clientY)
      if (!next) return
      dragRef.current.currentX = next.x
      dragRef.current.currentY = next.y
      scheduleLivePaint()
    }
    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      finishDrawing(upEvent.clientX, upEvent.clientY)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const handleResizePointerDown = (
    event: React.PointerEvent<HTMLSpanElement>,
    corner: 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    if (!draft || !isRegionPin(draft) || !canComment) return
    event.preventDefault()
    event.stopPropagation()
    resizeRef.current = { corner, origin: draft }

    const onMove = (moveEvent: PointerEvent) => {
      const resize = resizeRef.current
      if (!resize) return
      const point = pointerToPercent(moveEvent.clientX, moveEvent.clientY)
      if (!point) return
      const { origin, corner: activeCorner } = resize
      let nextLeft = origin.x_percent
      let nextTop = origin.y_percent
      let nextRight = origin.x_percent + origin.width_percent
      let nextBottom = origin.y_percent + origin.height_percent
      if (activeCorner.includes('w')) nextLeft = point.x
      if (activeCorner.includes('e')) nextRight = point.x
      if (activeCorner.includes('n')) nextTop = point.y
      if (activeCorner.includes('s')) nextBottom = point.y
      setDraft(normalizeRegion(nextLeft, nextTop, nextRight, nextBottom))
    }
    const onUp = () => {
      resizeRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const handleSubmitPin = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canComment || !draft || !projectId || !author.trim() || !comment.trim())
      return

    setSubmitting(true)
    setError(null)
    try {
      let attachment_url: string | null = null
      let attachment_name: string | null = null
      if (attachmentFile) {
        const uploaded = await uploadAttachment(
          attachmentFile,
          `pins/${projectId}`
        )
        attachment_url = uploaded.url
        attachment_name = uploaded.name
      }

      const { data, error: insertError } = await supabase
        .from('pins')
        .insert({
          project_id: projectId,
          x_percent: draft.x_percent,
          y_percent: draft.y_percent,
          width_percent: draft.width_percent,
          height_percent: draft.height_percent,
          author: author.trim(),
          comment: comment.trim(),
          change_detail: changeDetail.trim() || null,
          attachment_url,
          attachment_name,
          status: 'open',
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return
      }

      const pin = data as Pin
      setPins((prev) => [...prev, pin])

      if (project?.owner_id) {
        await supabase.from('notifications').insert({
          user_id: project.owner_id,
          project_id: project.id,
          message: `New pin on “${project.title}” by ${pin.author}: ${pin.comment}`,
        })
      }

      resetDraftForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedSavePin'))
    } finally {
      setSubmitting(false)
    }
  }

  const togglePinStatus = async (pin: Pin) => {
    if (!canComment && !isOwner) return
    const nextStatus = pin.status === 'open' ? 'resolved' : 'open'
    setTogglingId(pin.id)
    const { data, error: updateError } = await supabase
      .from('pins')
      .update({ status: nextStatus })
      .eq('id', pin.id)
      .select()
      .single()
    setTogglingId(null)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setPins((prev) =>
      prev.map((item) => (item.id === pin.id ? (data as Pin) : item))
    )
  }

  const submitReply = async (pinId: string) => {
    if (!canComment || !replyAuthor.trim() || !replyText.trim()) return
    const { data, error: insertError } = await supabase
      .from('pin_replies')
      .insert({
        pin_id: pinId,
        author: replyAuthor.trim(),
        body: replyText.trim(),
      })
      .select()
      .single()
    if (insertError) {
      setError(insertError.message)
      return
    }
    setReplies((prev) => [...prev, data as PinReply])
    setReplyText('')
  }

  const uploadNewVersion = async (file: File) => {
    if (!isOwner || !project) return
    try {
      const uploaded = await uploadAttachment(file, `versions/${project.id}`)
      const label = `v${versions.length + 1}`
      const { data, error: insertError } = await supabase
        .from('project_versions')
        .insert({
          project_id: project.id,
          asset_url: uploaded.url,
          label,
        })
        .select()
        .single()
      if (insertError) throw insertError

      await supabase
        .from('projects')
        .update({ asset_url: uploaded.url })
        .eq('id', project.id)

      setVersions((prev) => [...prev, data as ProjectVersion])
      setActiveAssetUrl(uploaded.url)
      setProject({ ...project, asset_url: uploaded.url })
      setAssetLoading(true)
      setAssetFailed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('versionUploadFailed'))
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        if (
          !(event.target instanceof HTMLInputElement) &&
          !(event.target instanceof HTMLTextAreaElement)
        ) {
          event.preventDefault()
          setSpaceDown(true)
        }
      }
      if (event.key === 'Escape') resetDraftForm()
      if (
        event.key === 'Enter' &&
        (event.metaKey || event.ctrlKey) &&
        draft &&
        canComment
      ) {
        const form = document.getElementById(
          'pin-draft-form'
        ) as HTMLFormElement | null
        form?.requestSubmit()
      }
      if (
        (event.key === 'r' || event.key === 'R') &&
        selectedPinId &&
        (canComment || isOwner) &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        const pin = pins.find((item) => item.id === selectedPinId)
        if (pin) togglePinStatus(pin)
      }
      if (event.key === '+' || event.key === '=') setZoom((z) => Math.min(3, z + 0.1))
      if (event.key === '-') setZoom((z) => Math.max(0.4, z - 0.1))
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, canComment, selectedPinId, pins, isOwner])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        {t('loadingProject')}
      </div>
    )
  }

  if (!project || !assetKind) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400">
        {error ?? t('projectNotFound')}
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen bg-slate-950 text-slate-100"
      translate="no"
      dir={dir}
    >
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              {t('visualProofing')} ·{' '}
              {shareMode === 'view' ? t('viewOnlyLink') : t('canCommentLink')}
            </p>
            <h1 className="text-xl font-semibold text-white">{project.title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {assetKindLabel(assetKind)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher compact />
            <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
                className="rounded-md p-2 text-slate-300 hover:bg-slate-800"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-12 text-center text-xs text-slate-400">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                className="rounded-md p-2 text-slate-300 hover:bg-slate-800"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                }}
                className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800"
              >
                {t('reset')}
              </button>
            </div>

            {versions.length > 0 && (
              <select
                value={activeAssetUrl}
                onChange={(event) => {
                  setActiveAssetUrl(event.target.value)
                  setAssetLoading(true)
                  setAssetFailed(false)
                }}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200"
              >
                <option value={project.asset_url}>{t('currentAsset')}</option>
                {versions.map((version) => (
                  <option key={version.id} value={version.asset_url}>
                    {version.label}
                  </option>
                ))}
              </select>
            )}

            {isOwner && (
              <>
                <input
                  ref={versionInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) uploadNewVersion(file)
                  }}
                />
                <button
                  type="button"
                  onClick={() => versionInputRef.current?.click()}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
                >
                  {t('uploadNewVersion')}
                </button>
              </>
            )}

            <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">
              {canComment
                ? isDrawing
                  ? t('drawing')
                  : t('hintControls')
                : t('viewOnlyBanner')}
            </div>
          </div>
        </header>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div
          className="relative flex flex-1 justify-center overflow-hidden p-6"
          onWheel={(event) => {
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault()
              setZoom((z) =>
                Math.min(3, Math.max(0.4, z + (event.deltaY > 0 ? -0.08 : 0.08)))
              )
            }
          }}
        >
          <div
            className="origin-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <div
              ref={canvasRef}
              className={`relative w-full max-w-5xl touch-none select-none ${
                spaceDown ? 'cursor-grab' : 'cursor-crosshair'
              }`}
              onPointerDown={handlePointerDown}
            >
              {assetFailed ? (
                <div className="flex min-h-[320px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
                  <p className="text-lg font-medium text-white">
                  {t('couldNotPreview')}
                </p>
                  <a
                    href={activeAssetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 text-sm text-sky-400 underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {t('openOriginal')}
                  </a>
                </div>
              ) : assetKind === 'pdf' ? (
                <iframe
                  src={renderableAssetUrl}
                  title={project.title}
                  className="h-[80vh] w-full rounded-lg border border-slate-800 bg-white"
                  onLoad={() => setAssetLoading(false)}
                />
              ) : assetKind === 'video' ? (
                <video
                  src={renderableAssetUrl}
                  controls
                  className="w-full rounded-lg border border-slate-800 bg-black"
                  onLoadedData={() => setAssetLoading(false)}
                  onError={() => {
                    setAssetLoading(false)
                    setAssetFailed(true)
                  }}
                />
              ) : assetKind === 'audio' ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900 p-8">
                  <audio
                    src={renderableAssetUrl}
                    controls
                    className="w-full max-w-lg"
                    onLoadedData={() => setAssetLoading(false)}
                  />
                </div>
              ) : assetKind === 'file' ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/70 px-6 py-12 text-center">
                  <FileUp className="mb-3 h-8 w-8 text-sky-400" />
                  <p className="text-lg font-medium text-white">{t('fileBoard')}</p>
                  <a
                    href={activeAssetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 rounded-lg bg-sky-500 px-4 py-2 text-sm text-white"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Link2 className="mr-2 inline h-4 w-4" />
                    {t('openFile')}
                  </a>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={renderableAssetUrl}
                  src={renderableAssetUrl}
                  alt={project.title}
                  className="pointer-events-none w-full rounded-lg border border-slate-800 bg-slate-900 object-contain shadow-2xl"
                  draggable={false}
                  onLoad={() => setAssetLoading(false)}
                  onError={() => {
                    setAssetLoading(false)
                    setAssetFailed(true)
                  }}
                />
              )}

              {filteredPins.map((pin, index) => {
                const region = isRegionPin(pin)
                const number =
                  pins.findIndex((item) => item.id === pin.id) + 1 || index + 1
                if (!region) {
                  return (
                    <button
                      key={pin.id}
                      type="button"
                      data-pin-marker
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedPinId(pin.id)
                      }}
                      className={`absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg ${
                        pin.status === 'resolved'
                          ? 'border-emerald-400 bg-emerald-500 text-white'
                          : 'border-sky-300 bg-sky-500 text-white'
                      }`}
                      style={{ left: `${pin.x_percent}%`, top: `${pin.y_percent}%` }}
                    >
                      {number}
                    </button>
                  )
                }
                return (
                  <button
                    key={pin.id}
                    type="button"
                    data-pin-marker
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedPinId(pin.id)
                    }}
                    className={`absolute z-20 rounded-md border-2 ${
                      pin.status === 'resolved'
                        ? 'border-emerald-400 bg-emerald-400/15'
                        : 'border-sky-400 bg-sky-400/20'
                    }`}
                    style={{
                      left: `${pin.x_percent}%`,
                      top: `${pin.y_percent}%`,
                      width: `${pin.width_percent}%`,
                      height: `${pin.height_percent}%`,
                    }}
                  >
                    <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-[11px] font-bold text-white">
                      {number}
                    </span>
                  </button>
                )
              })}

              <div
                ref={liveOverlayRef}
                data-pin-marker
                className="pointer-events-none absolute z-30 hidden rounded-md border-2 border-amber-400 bg-amber-400/20"
              />

              {draft && !isRegionPin(draft) && (
                <span
                  data-pin-marker
                  className="absolute z-30 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-500 text-xs font-bold text-white ring-4 ring-amber-400/30"
                  style={{ left: `${draft.x_percent}%`, top: `${draft.y_percent}%` }}
                >
                  +
                </span>
              )}

              {draft && isRegionPin(draft) && (
                <div
                  data-pin-marker
                  className="absolute z-30 rounded-md border-2 border-amber-400 bg-amber-400/20"
                  style={{
                    left: `${draft.x_percent}%`,
                    top: `${draft.y_percent}%`,
                    width: `${draft.width_percent}%`,
                    height: `${draft.height_percent}%`,
                  }}
                >
                  {(
                    [
                      ['nw', '-left-1.5 -top-1.5 cursor-nwse-resize'],
                      ['ne', '-right-1.5 -top-1.5 cursor-nesw-resize'],
                      ['sw', '-left-1.5 -bottom-1.5 cursor-nesw-resize'],
                      ['se', '-right-1.5 -bottom-1.5 cursor-nwse-resize'],
                    ] as const
                  ).map(([corner, className]) => (
                    <span
                      key={corner}
                      data-resize-handle
                      data-pin-marker
                      onPointerDown={(event) =>
                        handleResizePointerDown(event, corner)
                      }
                      className={`absolute h-3 w-3 rounded-sm border border-amber-200 bg-amber-400 ${className}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <aside className="flex w-[26rem] flex-col border-l border-slate-800 bg-slate-900/80">
        <div className="space-y-3 border-b border-slate-800 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-white">{t('pins')}</h2>
              <p className="text-sm text-slate-400">
                {filteredPins.length}/{pins.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportPinsToCsv(project.title, pins, replies)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              {t('csv')}
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchPins')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>

          <div className="flex gap-1">
            {(['all', 'open', 'resolved'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-md px-2.5 py-1 text-xs capitalize ${
                  statusFilter === value
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {value === 'all'
                  ? t('filterAll')
                  : value === 'open'
                    ? t('filterOpen')
                    : t('filterResolved')}
              </button>
            ))}
          </div>
        </div>

        {draft && canComment && (
          <div className="border-b border-slate-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-sky-300">
                <MessageSquarePlus className="h-4 w-4" />
                {t('newFeedback')}
              </div>
              <button type="button" onClick={resetDraftForm} className="p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form id="pin-draft-form" onSubmit={handleSubmitPin} className="space-y-3">
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder={t('yourName')}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
              />
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t('shortSummary')}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setDetailExpanded((open) => !open)}
                className="text-xs text-sky-400"
              >
                {detailExpanded ? t('hideDetails') : t('expandChangeNotes')}
              </button>
              {detailExpanded && (
                <textarea
                  value={changeDetail}
                  onChange={(event) => setChangeDetail(event.target.value)}
                  rows={7}
                  placeholder={t('changeNotesPlaceholder')}
                  className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={(event) =>
                  setAttachmentFile(event.target.files?.[0] ?? null)
                }
                className="block w-full text-xs text-slate-400"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? t('saving') : t('pinSave')}
              </button>
            </form>
          </div>
        )}

        {!canComment && (
          <div className="border-b border-slate-800 px-4 py-3 text-sm text-amber-200/90">
            {t('viewOnlyNotice')}
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {filteredPins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
              {t('noPinsMatch')}
            </div>
          ) : (
            filteredPins.map((pin) => {
              const number = pins.findIndex((item) => item.id === pin.id) + 1
              const pinReplies = replies.filter((reply) => reply.pin_id === pin.id)
              const selected = selectedPinId === pin.id
              const isOpen = pin.status === 'open'

              return (
                <article
                  key={pin.id}
                  className={`rounded-xl border p-4 ${
                    selected
                      ? 'border-sky-500 bg-slate-950'
                      : 'border-slate-800 bg-slate-950/70'
                  }`}
                  onClick={() => setSelectedPinId(pin.id)}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                        {number}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {pin.author}
                        </p>
                        <p className="text-xs text-slate-500">
                          {isRegionPin(pin)
                            ? `${t('area')} ${pin.width_percent?.toFixed(1)}% × ${pin.height_percent?.toFixed(1)}%`
                            : t('point')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                        isOpen
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {isOpen ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      {pin.status}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-100">
                    {pin.comment}
                  </p>
                  {pin.change_detail && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                      {pin.change_detail}
                    </p>
                  )}
                  {pin.attachment_url && (
                    <a
                      href={pin.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs text-sky-300"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {pin.attachment_name || 'Attachment'}
                    </a>
                  )}

                  {(canComment || isOwner) && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        togglePinStatus(pin)
                      }}
                      disabled={togglingId === pin.id}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                    >
                      {isOpen ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          {t('markResolved')}
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-amber-400" />
                          {t('reopen')}
                        </>
                      )}
                    </button>
                  )}

                  <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
                    <p className="text-xs font-medium text-slate-500">
                      {t('thread')} ({pinReplies.length})
                    </p>
                    {pinReplies.map((reply) => (
                      <div
                        key={reply.id}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-300"
                      >
                        <span className="font-medium text-slate-100">
                          {reply.author}:
                        </span>{' '}
                        {reply.body}
                      </div>
                    ))}
                    {canComment && selected && (
                      <div className="space-y-2">
                        <input
                          value={replyAuthor}
                          onChange={(event) => setReplyAuthor(event.target.value)}
                          placeholder={t('name')}
                          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                        />
                        <div className="flex gap-2">
                          <input
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder={t('reply')}
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => submitReply(pin.id)}
                            className="rounded-md bg-sky-500 px-2 text-xs text-white"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>

        <div className="border-t border-slate-800 px-4 py-3 text-[11px] text-slate-500">
          {t('embed')}:{' '}
          {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" data-project-id="${project.id}"></script>`}
        </div>
      </aside>
    </div>
  )
}

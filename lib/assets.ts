export type AssetKind = 'image' | 'website' | 'pdf' | 'video' | 'audio' | 'file'

export function getAssetKind(url: string): AssetKind {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()

    if (
      /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(path) ||
      /picsum\.photos|images\.unsplash\.com|placehold\.co|via\.placeholder/i.test(
        url
      )
    ) {
      return 'image'
    }

    if (/\.pdf$/i.test(path)) return 'pdf'
    if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(path)) return 'video'
    if (/\.(mp3|wav|m4a|aac)$/i.test(path)) return 'audio'
    if (/\.(docx?|xlsx?|pptx?|zip|rar|7z|csv|txt|json)$/i.test(path)) {
      return 'file'
    }

    // http(s) pages without a clear document extension → website capture
    if (!/\.[a-z0-9]{2,5}$/i.test(path) || path.endsWith('/')) {
      return 'website'
    }

    return 'file'
  } catch {
    return 'file'
  }
}

/** Resolve what the proofing canvas should load. */
export function getRenderableAssetUrl(url: string): string {
  const kind = getAssetKind(url)
  if (kind === 'website') {
    return `/api/capture?url=${encodeURIComponent(url)}&v=2`
  }
  return url
}

export function assetKindLabel(kind: AssetKind): string {
  switch (kind) {
    case 'image':
      return 'Image'
    case 'website':
      return 'Website (full-page capture)'
    case 'pdf':
      return 'PDF'
    case 'video':
      return 'Video'
    case 'audio':
      return 'Audio'
    default:
      return 'File'
  }
}

import { NextRequest, NextResponse } from 'next/server'

type MicrolinkResponse = {
  status?: string
  data?: {
    screenshot?: {
      url?: string
    }
  }
  message?: string
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 })
  }

  const microlinkUrl = new URL('https://api.microlink.io')
  microlinkUrl.searchParams.set('url', target.toString())
  microlinkUrl.searchParams.set('screenshot', 'true')
  microlinkUrl.searchParams.set('meta', 'false')
  microlinkUrl.searchParams.set('screenshot.fullPage', 'true')
  microlinkUrl.searchParams.set('waitUntil', 'networkidle2')

  try {
    const metaResponse = await fetch(microlinkUrl.toString(), {
      headers: {
        'User-Agent': 'ProofFlowCapture/1.0',
      },
      // Fresh capture when possible; browsers can still cache our response
      cache: 'no-store',
    })

    if (!metaResponse.ok) {
      return NextResponse.json(
        { error: `Capture provider failed (${metaResponse.status})` },
        { status: 502 }
      )
    }

    const payload = (await metaResponse.json()) as MicrolinkResponse
    const screenshotUrl = payload.data?.screenshot?.url

    if (payload.status !== 'success' || !screenshotUrl) {
      return NextResponse.json(
        { error: payload.message || 'Full-page screenshot unavailable' },
        { status: 502 }
      )
    }

    const imageResponse = await fetch(screenshotUrl, { cache: 'force-cache' })
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Screenshot download failed (${imageResponse.status})` },
        { status: 502 }
      )
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/png'
    const bytes = await imageResponse.arrayBuffer()

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Capture request failed' },
      { status: 502 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  try {
    const target = new URL(url)
    if (!['http:', 'https:'].includes(target.protocol)) {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
    }

    const response = await fetch(target.toString(), {
      method: 'HEAD',
      redirect: 'follow',
    })

    const xfo = (response.headers.get('x-frame-options') || '').toLowerCase()
    const csp = (response.headers.get('content-security-policy') || '').toLowerCase()

    const frameAncestors = csp
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('frame-ancestors'))

    const blockedByXfo = xfo.includes('deny') || xfo.includes('sameorigin')
    // Any frame-ancestors that is not * means our app origin is likely excluded
    const blockedByCsp = !!frameAncestors && !/\b\*\b/.test(frameAncestors)

    return NextResponse.json({
      blocked: blockedByXfo || blockedByCsp,
      xfo: xfo || null,
      frameAncestors: frameAncestors || null,
    })
  } catch {
    return NextResponse.json({ blocked: true, xfo: null, frameAncestors: null })
  }
}

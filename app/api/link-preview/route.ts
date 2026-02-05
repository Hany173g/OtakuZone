import { NextRequest, NextResponse } from 'next/server'

type Preview = {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  hostname?: string
}

const cache = new Map<string, { data: Preview; expiresAt: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60

function isBlockedHostname(hostname: string) {
  const h = hostname.toLowerCase()
  if (h === 'localhost') return true
  if (h === '127.0.0.1') return true
  if (h === '0.0.0.0') return true
  if (h === '::1') return true
  if (h.endsWith('.local')) return true
  return false
}

function extractMeta(html: string, prop: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i')
  const m = html.match(re)
  return m?.[1]?.trim()
}

function extractTitle(html: string) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m?.[1]?.trim()
}

function absolutizeImage(pageUrl: URL, imageUrl?: string) {
  if (!imageUrl) return undefined
  try {
    const u = new URL(imageUrl, pageUrl)
    return u.toString()
  } catch {
    return undefined
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const raw = searchParams.get('url')

    if (!raw) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    let target: URL
    try {
      target = new URL(raw)
    } catch {
      return NextResponse.json({ error: 'invalid url' }, { status: 400 })
    }

    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return NextResponse.json({ error: 'invalid protocol' }, { status: 400 })
    }

    if (isBlockedHostname(target.hostname)) {
      return NextResponse.json({ error: 'blocked host' }, { status: 400 })
    }

    const cached = cache.get(target.toString())
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    let html = ''
    try {
      const res = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'OtakuZoneLinkPreview/1.0',
          accept: 'text/html,application/xhtml+xml',
        },
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.toLowerCase().includes('text/html')) {
        const data: Preview = {
          url: target.toString(),
          hostname: target.hostname,
        }
        cache.set(target.toString(), { data, expiresAt: Date.now() + CACHE_TTL_MS })
        return NextResponse.json(data)
      }

      html = await res.text()
    } finally {
      clearTimeout(timer)
    }

    const title =
      extractMeta(html, 'og:title') ||
      extractMeta(html, 'twitter:title') ||
      extractTitle(html)

    const description =
      extractMeta(html, 'og:description') ||
      extractMeta(html, 'twitter:description') ||
      extractMeta(html, 'description')

    const siteName = extractMeta(html, 'og:site_name')

    const image = absolutizeImage(
      target,
      extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image')
    )

    const data: Preview = {
      url: target.toString(),
      title,
      description,
      siteName,
      image,
      hostname: target.hostname,
    }

    cache.set(target.toString(), { data, expiresAt: Date.now() + CACHE_TTL_MS })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

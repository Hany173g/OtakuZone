export function getVideoEmbedUrl(input?: string | null): string | null {
  if (!input) return null

  const trimmed = input.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    try {
      url = new URL(`https://${trimmed}`)
    } catch {
      return null
    }
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()

  if (host === 'youtu.be') {
    const id = url.pathname.replace('/', '')
    return id ? `https://www.youtube.com/embed/${id}` : null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (url.pathname.startsWith('/shorts/')) {
      const id = url.pathname.split('/shorts/')[1]?.split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (url.pathname.startsWith('/embed/')) {
      const id = url.pathname.split('/embed/')[1]?.split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  }

  if (host === 'vimeo.com') {
    const id = url.pathname.split('/')[1]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }

  if (host === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
    const id = url.pathname.split('/video/')[1]?.split('/')[0]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }

  return url.protocol === 'http:' || url.protocol === 'https:' ? trimmed : null
}

export function isSupportedVideoUrl(input?: string | null): boolean {
  return !!getVideoEmbedUrl(input)
}

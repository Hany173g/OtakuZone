function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function unescapeHtml(input: string) {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function escapeAttr(input: string) {
  return input.replace(/"/g, '&quot;')
}

function sanitizeUrl(input: string) {
  const url = input.trim()
  if (!url) return ''
  if (url.startsWith('/')) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return ''
}

function sanitizeColor(input: string) {
  const v = input.trim()
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return v
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v
  if (/^#[0-9a-fA-F]{8}$/.test(v)) return v
  if (/^[a-zA-Z]+$/.test(v)) return v
  return ''
}

function sanitizeSize(input: string) {
  const n = Number(input)
  if (!Number.isFinite(n)) return ''
  if (n < 8 || n > 48) return ''
  return String(Math.round(n))
}

export function bbcodeToHtml(input: string) {
  const raw = String(input || '')

  const blocks: Array<{ token: string; html: string }> = []
  const store = (html: string) => {
    const token = `@@BB${blocks.length}@@`
    blocks.push({ token, html })
    return token
  }

  let out = escapeHtml(raw).replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // [code] blocks first (avoid further parsing inside)
  out = out.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, (_m, inner) => {
    return store(`<pre><code>${inner}</code></pre>`)
  })

  // [quote] blocks
  out = out.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, (_m, inner) => {
    return store(`<blockquote>${inner}</blockquote>`)
  })

  // Basic formatting
  out = out.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>')
  out = out.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>')
  out = out.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>')
  out = out.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>')

  // [spoiler]
  out = out.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, (_m, inner) => {
    return `<details><summary>إظهار/إخفاء</summary><div>${inner}</div></details>`
  })

  // [color]
  out = out.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, (_m, c, inner) => {
    const color = sanitizeColor(unescapeHtml(String(c)))
    if (!color) return inner
    return `<span style=\"color:${escapeAttr(color)}\">${inner}</span>`
  })

  // [size]
  out = out.replace(/\[size=([^\]]+)\]([\s\S]*?)\[\/size\]/gi, (_m, s, inner) => {
    const size = sanitizeSize(unescapeHtml(String(s)))
    if (!size) return inner
    return `<span style=\"font-size:${escapeAttr(size)}px\">${inner}</span>`
  })

  // [url]
  out = out.replace(/\[url\]([^\[]+?)\[\/url\]/gi, (_m, u) => {
    const url = sanitizeUrl(unescapeHtml(String(u)))
    if (!url) return String(u)
    const safeHref = escapeAttr(escapeHtml(url))
    return `<a href=\"${safeHref}\" target=\"_blank\" rel=\"noopener noreferrer\">${String(u)}</a>`
  })

  out = out.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (_m, u, text) => {
    const url = sanitizeUrl(unescapeHtml(String(u)))
    if (!url) return String(text)
    const safeHref = escapeAttr(escapeHtml(url))
    return `<a href=\"${safeHref}\" target=\"_blank\" rel=\"noopener noreferrer\">${String(text)}</a>`
  })

  // [img]
  out = out.replace(/\[img\]([^\[]+?)\[\/img\]/gi, (_m, u) => {
    const url = sanitizeUrl(unescapeHtml(String(u)))
    if (!url) return ''
    const safeSrc = escapeAttr(escapeHtml(url))
    return `<img src=\"${safeSrc}\" alt=\"image\" />`
  })

  // Convert remaining newlines
  out = out.replace(/\n/g, '<br />')

  // Restore stored blocks
  for (const b of blocks) {
    out = out.replaceAll(b.token, b.html)
  }

  return out
}

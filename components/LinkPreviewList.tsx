'use client'

import { useEffect, useMemo, useState } from 'react'

type Preview = {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  hostname?: string
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ')
}

function extractUrls(htmlOrText: string, max: number) {
  const text = stripHtml(htmlOrText)
  const re = /(https?:\/\/[^\s"'<>]+)/g
  const matches = text.match(re) || []
  const uniq: string[] = []
  for (const m of matches) {
    const u = m.trim().replace(/[),.!?]+$/, '')
    if (!uniq.includes(u)) uniq.push(u)
    if (uniq.length >= max) break
  }
  return uniq
}

function LinkPreviewCard({ preview }: { preview: Preview }) {
  const host = preview.siteName || preview.hostname
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noreferrer"
      className="block bg-white rounded-xl border border-gray-200 hover:shadow-md transition overflow-hidden"
    >
      <div className="flex">
        {preview.image && (
          <div className="w-28 h-28 flex-shrink-0 bg-gray-100">
            <img src={preview.image} alt={preview.title || host || 'preview'} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4 flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1 truncate">{host || preview.url}</div>
          <div className="font-semibold text-gray-800 line-clamp-2">
            {preview.title || preview.url}
          </div>
          {preview.description && (
            <div className="text-sm text-gray-600 mt-1 line-clamp-2">{preview.description}</div>
          )}
        </div>
      </div>
    </a>
  )
}

export default function LinkPreviewList({ html, max = 2 }: { html: string; max?: number }) {
  const urls = useMemo(() => extractUrls(html, max), [html, max])
  const [previews, setPreviews] = useState<Preview[]>([])

  useEffect(() => {
    let mounted = true

    const run = async () => {
      if (urls.length === 0) {
        setPreviews([])
        return
      }

      const results: Preview[] = []
      for (const url of urls) {
        try {
          const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
          if (!res.ok) {
            results.push({ url })
            continue
          }
          const data = (await res.json()) as Preview
          results.push({ ...data, url })
        } catch {
          results.push({ url })
        }
      }

      if (mounted) setPreviews(results)
    }

    run()

    return () => {
      mounted = false
    }
  }, [urls])

  if (urls.length === 0) return null

  return (
    <div className="mt-4 space-y-3">
      {previews.map((p) => (
        <LinkPreviewCard key={p.url} preview={p} />
      ))}
    </div>
  )
}

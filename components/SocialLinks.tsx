'use client'

import Link from 'next/link'

export type SocialPlatform = 'discord' | 'youtube' | 'facebook' | 'tiktok' | 'telegram' | 'instagram'

export const socialPlatforms: Array<{ key: SocialPlatform; label: string }> = [
  { key: 'discord', label: 'Discord' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'instagram', label: 'Instagram' },
]

export function SocialIcon(props: { platform: SocialPlatform; className?: string }) {
  const cls = props.className || 'w-5 h-5'

  switch (props.platform) {
    case 'discord':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
          <path d="M19.54 4.26a16.6 16.6 0 0 0-4.11-1.27.12.12 0 0 0-.13.06c-.18.33-.38.76-.52 1.1a15.48 15.48 0 0 0-4.66 0c-.14-.34-.35-.77-.53-1.1a.12.12 0 0 0-.13-.06c-1.43.25-2.82.68-4.11 1.27a.11.11 0 0 0-.05.04C.47 8.13-.32 11.84.07 15.5c0 .05.03.1.07.13 1.53 1.12 3.01 1.8 4.46 2.25.05.02.11 0 .14-.05.34-.46.65-.95.91-1.46.03-.06 0-.13-.06-.15-.49-.19-.95-.42-1.4-.68-.06-.03-.06-.12 0-.16.1-.08.2-.15.3-.23.05-.04.12-.04.17-.01 2.94 1.34 6.12 1.34 9.02 0 .05-.02.12-.02.17.01.1.08.2.16.3.23.06.04.06.13 0 .16-.45.26-.91.49-1.4.68-.06.02-.09.1-.06.15.27.51.57 1 .92 1.46.03.05.09.07.14.05 1.45-.45 2.93-1.13 4.46-2.25.04-.03.07-.08.07-.13.46-4.23-.77-7.9-3.71-11.2a.11.11 0 0 0-.05-.04zM8.02 13.72c-.88 0-1.6-.8-1.6-1.78s.71-1.79 1.6-1.79c.89 0 1.62.81 1.6 1.79 0 .98-.72 1.78-1.6 1.78zm7.96 0c-.88 0-1.6-.8-1.6-1.78s.71-1.79 1.6-1.79c.89 0 1.62.81 1.6 1.79 0 .98-.71 1.78-1.6 1.78z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9A28.5 28.5 0 0 0 2 12a28.5 28.5 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28.5 28.5 0 0 0 22 12a28.5 28.5 0 0 0-.4-4.8zM10.2 14.9V9.1L15.3 12l-5.1 2.9z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
          <path d="M22 12a10 10 0 1 0-11.56 9.87v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.76l-.44 2.88h-2.32v6.99A10 10 0 0 0 22 12z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
          <path d="M16.8 5.2c.9.9 2 1.4 3.2 1.5V9c-1.7-.1-3.2-.8-4.4-2v7.1c0 3-2.4 5.4-5.4 5.4S4.8 17.1 4.8 14.1s2.4-5.4 5.4-5.4c.3 0 .6 0 .9.1v2.6c-.3-.1-.6-.2-.9-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9V3.8h2.7c.1.5.4 1 .8 1.4z" />
        </svg>
      )
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
          <path d="M9.6 15.4 9.3 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.2.2 1.4-.7L21 4.8c.2-1-.4-1.4-1.1-1.1L2.9 10.2c-1 .4-1 1 0 1.3l4.4 1.4L17.6 6.4c.5-.3 1-.1.6.2L9.6 15.4z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
          <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4z" />
          <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 0 0 12 9.2z" />
          <circle cx="17.5" cy="6.5" r="1.2" />
        </svg>
      )
  }
}

export function SocialLinksBar(props: { links?: Record<string, string | undefined | null> | null; userId?: string }) {
  const links = props.links || {}
  const items = socialPlatforms
    .map((p) => ({ platform: p.key, label: p.label, url: (links as any)[p.key] as string | undefined }))
    .filter((x) => Boolean(x.url))

  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((it) => (
        <Link
          key={it.platform}
          href={String(it.url)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
        >
          <SocialIcon platform={it.platform as any} className="w-5 h-5" />
          <span>{it.label}</span>
        </Link>
      ))}
    </div>
  )
}

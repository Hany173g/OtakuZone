'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type TabKey = 'overview' | 'posts' | 'requests' | 'members' | 'settings' | 'logs'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'posts', label: 'المنشورات' },
  { key: 'requests', label: 'طلبات الانضمام' },
  { key: 'members', label: 'الأعضاء' },
  { key: 'settings', label: 'الإعدادات' },
  { key: 'logs', label: 'السجل' },
]

export default function GroupDashboardTabs(props: {
  slug: string
  groupName: string
  panels: Partial<Record<TabKey, ReactNode>>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tab = (searchParams.get('tab') as TabKey) || 'overview'

  const active = useMemo(() => {
    return (TABS.find((t) => t.key === tab)?.key || 'overview') as TabKey
  }, [tab])

  const setTab = (t: TabKey) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set('tab', t)
    router.replace(`/groups/${props.slug}/dashboard?${p.toString()}`)
  }

  return (
    <div>
      <div className="rounded-2xl overflow-hidden border border-purple-100 dark:border-slate-800 shadow-sm">
        <div className="bg-gradient-to-r from-anime-purple via-anime-pink to-anime-blue p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-2xl font-extrabold">لوحة إدارة المجتمع</h1>
              <p className="text-white/90 mt-1 font-semibold">{props.groupName}</p>
            </div>
            <Link
              href={`/groups/${props.slug}`}
              className="text-white/95 hover:text-white font-semibold underline underline-offset-4"
            >
              الرجوع للمجتمع
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {TABS.map((t) => {
              const isActive = t.key === active
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={
                    isActive
                      ? 'px-4 py-2 rounded-full bg-white text-slate-900 font-bold shadow-sm'
                      : 'px-4 py-2 rounded-full bg-white/15 text-white font-semibold hover:bg-white/25 transition'
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-gradient-to-b from-white to-purple-50/30 dark:from-slate-950 dark:to-slate-950 p-6">
          {props.panels?.[active] ?? null}
        </div>
      </div>
    </div>
  )
}

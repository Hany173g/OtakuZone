'use client'

export type SeenKind = 'topic' | 'groupTopic'

const STORAGE_KEYS: Record<SeenKind, string> = {
  topic: 'oz_seen_topics',
  groupTopic: 'oz_seen_group_topics',
}

function safeParse(value: string | null): string[] {
  if (!value) return []
  try {
    const v = JSON.parse(value)
    return Array.isArray(v) ? v.map((x) => String(x)) : []
  } catch {
    return []
  }
}

export function readSeen(kind: SeenKind): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set()
    const raw = window.localStorage.getItem(STORAGE_KEYS[kind])
    return new Set(safeParse(raw))
  } catch {
    return new Set()
  }
}

export function markSeen(kind: SeenKind, id: string) {
  const key = String(id || '').trim()
  if (!key) return

  try {
    if (typeof window === 'undefined') return

    const set = readSeen(kind)
    if (set.has(key)) return
    set.add(key)

    window.localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(Array.from(set)))
    window.dispatchEvent(new CustomEvent('oz_seen_changed', { detail: { kind } }))
  } catch {
    // ignore
  }
}

export function clearSeen(kind: SeenKind) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(STORAGE_KEYS[kind])
    window.dispatchEvent(new CustomEvent('oz_seen_changed', { detail: { kind } }))
  } catch {
    // ignore
  }
}

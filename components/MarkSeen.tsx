'use client'

import { useEffect } from 'react'
import { markSeen, SeenKind } from '@/lib/seen'

export default function MarkSeen(props: { kind: SeenKind; id: string }) {
  useEffect(() => {
    markSeen(props.kind, props.id)
  }, [props.kind, props.id])

  return null
}

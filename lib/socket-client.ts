'use client'

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null
let connectPromise: Promise<void> | null = null

function isRealtimeEnabled() {
  const flag = process.env.NEXT_PUBLIC_REALTIME_ENABLED
  if (flag === 'true') return true
  if (flag === 'false') return false
  // default: off in production, on in dev
  return process.env.NODE_ENV !== 'production'
}

const noopSocket = {
  connected: false,
  on: () => noopSocket,
  off: () => noopSocket,
  connect: () => noopSocket,
  emit: () => noopSocket,
  auth: {},
} as any

async function ensureConnected() {
  if (!socket) return
  if (socket.connected) return
  if (connectPromise) return connectPromise

  connectPromise = (async () => {
    try {
      const res = await fetch('/api/auth/socket-token', { cache: 'no-store' })
      if (!res.ok) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[socket] token fetch failed', res.status)
        }
        return
      }
      const data = await res.json().catch(() => null)
      const token = data?.token
      if (!token) return
      socket.auth = { token }
      ;(socket as any).io.opts.query = { token }
      socket.connect()
    } finally {
      connectPromise = null
    }
  })()

  return connectPromise
}

export function getSocket() {
  if (!isRealtimeEnabled()) {
    return noopSocket
  }
  if (!socket) {
    socket = io({
      path: '/socket.io',
      withCredentials: true,
      autoConnect: false,
    })

    if (process.env.NODE_ENV !== 'production') {
      socket.on('connect', () => {
        console.log('[socket] connected', socket?.id)
      })
      socket.on('disconnect', (reason) => {
        console.log('[socket] disconnected', reason)
      })
      socket.on('connect_error', (err) => {
        console.log('[socket] connect_error', err?.message || err)
      })
    }

    socket.on('connect_error', async (err: any) => {
      if (String(err?.message || '').toLowerCase().includes('unauthorized')) {
        try {
          await ensureConnected()
        } catch {
          // ignore
        }
      }
    })
  }

  void ensureConnected()
  return socket
}

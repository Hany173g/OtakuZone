const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const envLocalPath = path.join(__dirname, '.env.local')
const envPath = path.join(__dirname, '.env')

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const http = require('http')
const next = require('next')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev })
const handle = app.getRequestHandler()

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

function parseCookies(cookieHeader) {
  const out = {}
  if (!cookieHeader) return out
  const parts = cookieHeader.split(';')
  for (const p of parts) {
    const idx = p.indexOf('=')
    if (idx === -1) continue
    const k = p.slice(0, idx).trim()
    const v = p.slice(idx + 1).trim()
    if (!k) continue
    out[k] = decodeURIComponent(v)
  }
  return out
}

app.prepare().then(() => {
  const server = http.createServer((req, res) => handle(req, res))

  const io = new Server(server, {
    path: '/socket.io',
  })

  global.io = io

  io.use((socket, nextFn) => {
    try {
      const authToken = socket.handshake?.auth?.token
      const queryToken = socket.handshake?.query?.token
      const cookies = parseCookies(socket.request.headers.cookie)
      const cookieToken = cookies['auth-token']

      const token = authToken || queryToken || cookieToken
      if (!token) return nextFn(new Error('unauthorized'))

      const decoded = jwt.verify(token, JWT_SECRET)
      if (!decoded || !decoded.userId) return nextFn(new Error('unauthorized'))

      socket.data.userId = String(decoded.userId)
      return nextFn()
    } catch (e) {
      if (dev) {
        console.log('[socket] unauthorized', e && e.message ? e.message : String(e))
      }
      return nextFn(new Error('unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    socket.join(`user:${userId}`)

    socket.on('disconnect', () => {
      // noop
    })
  })

  server.listen(port, () => {
    console.log(`> OtakuZone server listening on http://localhost:${port}`)
  })
})

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getSession } from '@/lib/auth'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

export async function GET() {
  const session = await getSession()
  if (!session?.id) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
  }

  const token = jwt.sign(
    { userId: session.id, scope: 'socket' },
    JWT_SECRET,
    { expiresIn: '2h' }
  )

  return NextResponse.json({ token })
}

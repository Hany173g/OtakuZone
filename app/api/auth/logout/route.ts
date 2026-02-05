import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.set('auth-token', '', { path: '/', maxAge: 0 })
    
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}


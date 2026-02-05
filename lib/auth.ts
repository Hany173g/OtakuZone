import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import User from '@/models/User'
import connectDB from './mongodb'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

export interface UserSession {
  id: string
  name: string | null
  email: string
  role: string
  image?: string | null
  socialLinks?: {
    discord?: string
    youtube?: string
    facebook?: string
    tiktok?: string
    telegram?: string
    instagram?: string
  }
  profileVisibility?: 'public' | 'private' | 'friends'
  showEmail?: boolean
  showActivity?: boolean
  allowMessages?: boolean
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    await connectDB()
    
    const user = await User.findById(decoded.userId).lean()
    
    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      name: user.name || null,
      email: user.email,
      role: user.role,
      image: user.image || null,
      socialLinks: (user as any).socialLinks || {},
      profileVisibility: (user as any).profileVisibility,
      showEmail: (user as any).showEmail,
      showActivity: (user as any).showActivity,
      allowMessages: (user as any).allowMessages,
    }
  } catch (error) {
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
  return token
}


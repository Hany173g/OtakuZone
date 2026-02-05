import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import User from '@/models/User'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'تأكيد كلمة المرور غير مطابق',
  path: ['confirmPassword'],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Email removed from logs - secure data
    
    const validatedData = registerSchema.parse(body)

    const result = await withDB(async () => {
      // Check if user already exists
      const existingUser = await User.findOne({ email: validatedData.email })
      console.log('Existing user check:', existingUser ? 'Found' : 'Not found')

      if (existingUser) {
        return { error: 'البريد الإلكتروني مستخدم بالفعل', status: 400 }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10)
      console.log('Password hashed')

      // Create user
      const user = await User.create({
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
      })
      console.log('User created:', user._id.toString())

      // Create session token
      const token = await createSession(user._id.toString())
      const cookieStore = await cookies()
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      console.log('Session created')

      return {
        user: {
          id: user._id.toString(),
          name: user.name,
          // Email removed - secure data
          role: user.role,
        }
      }
    })

    if (result.error) {
      console.error('Register error:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    console.log('Register success:', result.user)
    return NextResponse.json(
      { message: 'تم إنشاء الحساب بنجاح', user: result.user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register exception:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'فشل إنشاء الحساب', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


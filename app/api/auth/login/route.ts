import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import User from '@/models/User'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const user = await withDB(async () => {
      const foundUser = await User.findOne({ email: validatedData.email }).lean()

      if (!foundUser || !foundUser.password) {
        return null
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, foundUser.password)

      if (!isValidPassword) {
        return null
      }

      return foundUser
    })

    if (!user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

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

    return NextResponse.json({
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user._id.toString(),
        name: user.name,
        // Email removed - secure data
        role: user.role,
        image: user.image,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'فشل تسجيل الدخول' },
      { status: 500 }
    )
  }
}


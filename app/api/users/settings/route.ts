import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import User from '@/models/User'
import { getSession } from '@/lib/auth'
import { translateZodError, ERROR_MESSAGES } from '@/lib/validation-ar'
import { z } from 'zod'
import mongoose from 'mongoose'

const settingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']),
  showEmail: z.boolean(),
  showActivity: z.boolean(),
  allowMessages: z.boolean(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = settingsSchema.parse(body)

    const user = await withDB(async () => {
      return await User.findByIdAndUpdate(
        new mongoose.Types.ObjectId(session.id),
        {
          profileVisibility: validatedData.profileVisibility,
          showEmail: validatedData.showEmail,
          showActivity: validatedData.showActivity,
          allowMessages: validatedData.allowMessages,
        },
        { new: true }
      ).select('profileVisibility showEmail showActivity allowMessages').lean()
    })

    if (!user) {
      return NextResponse.json(
        { error: 'لم يتم العثور على المستخدم' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...user,
      id: user._id.toString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: translateZodError(error) },
        { status: 400 }
      )
    }
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.UPDATE_FAILED },
      { status: 500 }
    )
  }
}


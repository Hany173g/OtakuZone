import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import User from '@/models/User'
import { getSession } from '@/lib/auth'
import { translateZodError } from '@/lib/validation-ar'
import { z } from 'zod'
import mongoose from 'mongoose'

const imageSchema = z
  .string()
  .trim()
  .refine(
    (v) => {
      if (!v) return false
      if (v.startsWith('/')) return true
      try {
        const u = new URL(v)
        return u.protocol === 'http:' || u.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'رابط الصورة غير صالح' }
  )

type Platform = 'discord' | 'youtube' | 'facebook' | 'tiktok' | 'telegram' | 'instagram'

const platformHosts: Record<Platform, string[]> = {
  discord: ['discord.gg', 'discord.com', 'www.discord.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  telegram: ['t.me', 'telegram.me', 'www.telegram.me'],
  instagram: ['instagram.com', 'www.instagram.com'],
}

function isValidPlatformUrl(platform: Platform, value: string) {
  try {
    const u = new URL(value)
    const host = u.hostname.toLowerCase()
    return platformHosts[platform].some((h) => host === h || host.endsWith('.' + h))
  } catch {
    return false
  }
}

const platformUrlSchema = (platform: Platform) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.trim() : ''))
    .refine((v) => v === '' || isValidPlatformUrl(platform, v), {
      message: 'ده مش التطبيق المحدد',
    })
    .transform((v) => (v === '' ? undefined : v))

const profileSchema = z.object({
  name: z.string().trim().min(2, 'الاسم قصير جداً').max(50, 'الاسم طويل جداً').optional(),
  image: imageSchema.optional().nullable(),
  socialLinks: z
    .object({
      discord: platformUrlSchema('discord'),
      youtube: platformUrlSchema('youtube'),
      facebook: platformUrlSchema('facebook'),
      tiktok: platformUrlSchema('tiktok'),
      telegram: platformUrlSchema('telegram'),
      instagram: platformUrlSchema('instagram'),
    })
    .optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const validated = profileSchema.parse(body)

    if (!validated.name && validated.image === undefined && validated.socialLinks === undefined) {
      return NextResponse.json({ error: 'لا توجد تغييرات' }, { status: 400 })
    }

    const updated = await withDB(async () => {
      const update: any = {}
      if (validated.name) update.name = validated.name
      if (validated.image !== undefined) update.image = validated.image || undefined
      if (validated.socialLinks !== undefined) {
        update.socialLinks = {
          ...(validated.socialLinks || {}),
        }
      }

      return await User.findByIdAndUpdate(new mongoose.Types.ObjectId(session.id), update, { new: true })
        .select('name image role profileVisibility showActivity allowMessages socialLinks')
        .lean()
    })

    if (!updated) {
      return NextResponse.json({ error: 'لم يتم العثور على المستخدم' }, { status: 404 })
    }

    return NextResponse.json({
      id: (updated as any)._id.toString(),
      name: (updated as any).name || null,
      // Email removed - secure data
      role: (updated as any).role,
      image: (updated as any).image || null,
      socialLinks: (updated as any).socialLinks || {},
      profileVisibility: (updated as any).profileVisibility,
      // showEmail removed - secure data
      showActivity: (updated as any).showActivity,
      allowMessages: (updated as any).allowMessages,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: translateZodError(error) }, { status: 400 })
    }
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'تعذر تحديث الملف الشخصي' }, { status: 500 })
  }
}

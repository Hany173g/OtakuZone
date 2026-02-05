import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import GroupLog from '@/models/GroupLog'
import mongoose from 'mongoose'
import { getSession } from '@/lib/auth'
import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import crypto from 'crypto'

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id)
}

async function requireAdmin(groupId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const m = await GroupMember.findOne({ groupId, userId, status: 'active' }).select('role').lean()
  if (m?.role !== 'admin') return null
  return 'admin'
}

async function saveUploadedFile(file: File, folderName: string) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folderName)
  await mkdir(uploadDir, { recursive: true })

  const originalName = (file as any).name ? String((file as any).name) : ''
  const ext = path.extname(originalName).toLowerCase() || '.bin'

  const filename = `${randomUUID()}${ext}`
  const absolutePath = path.join(uploadDir, filename)

  await writeFile(absolutePath, buffer)

  return `/uploads/${folderName}/${filename}`
}

function parseCloudinaryUrl(cloudinaryUrl: string) {
  if (!cloudinaryUrl.startsWith('cloudinary://')) return null
  try {
    const u = new URL('http://' + cloudinaryUrl.slice('cloudinary://'.length))
    const cloud_name = u.hostname
    const api_key = decodeURIComponent(u.username || '')
    const api_secret = decodeURIComponent(u.password || '')
    if (!cloud_name || !api_key || !api_secret) return null
    if ([cloud_name, api_key, api_secret].some((v) => v.includes('<') || v.includes('>'))) return null
    return { cloud_name, api_key, api_secret }
  } catch {
    return null
  }
}

async function uploadToCloudinary(file: File, folder: string) {
  const cloudinaryUrl = process.env.CLOUDINARY_URL
  if (!cloudinaryUrl) return null

  const parsed = parseCloudinaryUrl(cloudinaryUrl)
  if (!parsed) return null

  const timestamp = Math.floor(Date.now() / 1000)
  const publicId = randomUUID()
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`
  const signature = crypto.createHash('sha1').update(paramsToSign + parsed.api_secret).digest('hex')

  const fd = new FormData()
  fd.set('file', file)
  fd.set('api_key', parsed.api_key)
  fd.set('timestamp', String(timestamp))
  fd.set('folder', folder)
  fd.set('public_id', publicId)
  fd.set('signature', signature)

  const endpoint = `https://api.cloudinary.com/v1_1/${parsed.cloud_name}/image/upload`
  const response = await fetch(endpoint, { method: 'POST', body: fd })
  const data: any = await response.json().catch(() => null)
  if (!response.ok) return null
  return data?.secure_url || null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupIdRaw = String(searchParams.get('groupId') || '').trim()

    if (!groupIdRaw || !mongoose.Types.ObjectId.isValid(groupIdRaw)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const groupId = toObjectId(groupIdRaw)
      const userId = toObjectId(session.id)

      const role = await requireAdmin(groupId, userId)
      if (!role) return { error: 'غير مصرح', status: 403 as const }

      const g: any = await Group.findById(groupId)
        .select('name slug description image coverImage isPublic isApprovalRequired settings')
        .lean()

      if (!g) return { error: 'المجتمع غير موجود', status: 404 as const }

      return {
        group: {
          id: String(g._id),
          name: g.name,
          slug: g.slug,
          description: g.description || '',
          image: g.image,
          coverImage: g.coverImage,
          isPublic: Boolean(g.isPublic),
          isApprovalRequired: Boolean(g.isApprovalRequired),
          settings: {
            postApprovalRequired: Boolean(g?.settings?.postApprovalRequired),
            allowAnonymousPosts: Boolean(g?.settings?.allowAnonymousPosts),
          },
        },
      }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching group settings:', error)
    return NextResponse.json({ error: 'تعذر تحميل الإعدادات' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const formData = await request.formData()

    const groupIdRaw = String(formData.get('groupId') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const isPublic = String(formData.get('isPublic') || 'true') === 'true'
    const isApprovalRequired = String(formData.get('isApprovalRequired') || 'false') === 'true'

    const postApprovalRequired = String(formData.get('postApprovalRequired') || 'false') === 'true'
    const allowAnonymousPosts = String(formData.get('allowAnonymousPosts') || 'false') === 'true'

    const imageFile = formData.get('image')
    const coverImageFile = formData.get('coverImage')

    if (!groupIdRaw || !mongoose.Types.ObjectId.isValid(groupIdRaw)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    if (!name || name.length < 3 || name.length > 100) {
      return NextResponse.json({ error: 'اسم المجتمع يجب أن يكون بين 3 و 100 حرف' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const groupId = toObjectId(groupIdRaw)
      const userId = toObjectId(session.id)

      const role = await requireAdmin(groupId, userId)
      if (!role) return { error: 'غير مصرح', status: 403 as const }

      const existing: any = await Group.findById(groupId)
        .select('_id name description image coverImage isPublic isApprovalRequired settings')
        .lean()

      if (!existing) return { error: 'المجتمع غير موجود', status: 404 as const }

      let image = existing.image
      let coverImage = existing.coverImage

      if (imageFile instanceof File && imageFile.size > 0) {
        const folder = process.env.CLOUDINARY_FOLDER || 'otakuzone/groups'
        const cloud = await uploadToCloudinary(imageFile, folder)
        if (!cloud && process.env.NODE_ENV === 'production') {
          return { error: 'Cloudinary غير مُعد. يرجى ضبط CLOUDINARY_URL', status: 500 as const }
        }
        image = cloud || (await saveUploadedFile(imageFile, 'groups'))
      }

      if (coverImageFile instanceof File && coverImageFile.size > 0) {
        const folder = process.env.CLOUDINARY_FOLDER || 'otakuzone/groups'
        const cloud = await uploadToCloudinary(coverImageFile, folder)
        if (!cloud && process.env.NODE_ENV === 'production') {
          return { error: 'Cloudinary غير مُعد. يرجى ضبط CLOUDINARY_URL', status: 500 as const }
        }
        coverImage = cloud || (await saveUploadedFile(coverImageFile, 'groups'))
      }

      await Group.updateOne(
        { _id: groupId },
        {
          $set: {
            name,
            description: description || undefined,
            image,
            coverImage,
            isPublic,
            isApprovalRequired,
            settings: {
              postApprovalRequired,
              allowAnonymousPosts,
            },
          },
        }
      )

      await GroupLog.create({
        groupId,
        actorId: userId,
        action: 'group_settings_updated',
        meta: {
          isPublic,
          isApprovalRequired,
          postApprovalRequired,
          allowAnonymousPosts,
        },
      })

      return { ok: true }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating group settings:', error)
    return NextResponse.json({ error: 'تعذر حفظ الإعدادات' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'
import { getSession } from '@/lib/auth'
import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import crypto from 'crypto'

type CreateGroupError = { error: string; status: number }

function isCreateGroupError(v: unknown): v is CreateGroupError {
  return (
    typeof v === 'object' &&
    v !== null &&
    'error' in v &&
    'status' in v &&
    typeof (v as any).error === 'string' &&
    typeof (v as any).status === 'number'
  )
}

function normalizeGroupUsername(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const formData = await request.formData()

    const name = String(formData.get('name') || '').trim()
    const usernameRaw = String(formData.get('username') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const isPublic = String(formData.get('isPublic') || 'true') === 'true'
    const isApprovalRequired = String(formData.get('isApprovalRequired') || 'false') === 'true'
    const category = String(formData.get('category') || '').trim()
    const tagsRaw = String(formData.get('tags') || '').trim()

    const imageFile = formData.get('image')
    const coverImageFile = formData.get('coverImage')

    if (!name || name.length < 3 || name.length > 100) {
      return NextResponse.json(
        { error: 'اسم الجروب يجب أن يكون على الأقل 3 أحرف وعلى الأكثر 100 حرف' },
        { status: 400 }
      )
    }

    if (!usernameRaw) {
      return NextResponse.json(
        { error: 'اسم المستخدم للجروب مطلوب' },
        { status: 400 }
      )
    }

    const slug = normalizeGroupUsername(usernameRaw)
    if (!slug || slug.length < 3 || slug.length > 30) {
      return NextResponse.json(
        { error: 'اسم المستخدم للجروب غير صالح (من 3 إلى 30 حرفًا، أحرف إنجليزية/أرقام/شرطة فقط)' },
        { status: 400 }
      )
    }

    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return NextResponse.json(
        { error: 'صورة الجروب مطلوبة' },
        { status: 400 }
      )
    }

    if (!(coverImageFile instanceof File) || coverImageFile.size === 0) {
      return NextResponse.json(
        { error: 'صورة الغلاف مطلوبة' },
        { status: 400 }
      )
    }

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const group = await withDB(async () => {
      const existing = await Group.findOne({ slug }).select('_id').lean()
      if (existing) {
        return { error: 'اسم المستخدم للجروب مستخدم بالفعل', status: 400 as const }
      }

      const folder = process.env.CLOUDINARY_FOLDER || 'otakuzone/groups'
      const imageCloud = await uploadToCloudinary(imageFile, folder)
      const coverCloud = await uploadToCloudinary(coverImageFile, folder)

      if ((!imageCloud || !coverCloud) && process.env.NODE_ENV === 'production') {
        return { error: 'Cloudinary غير مُعد. يرجى ضبط CLOUDINARY_URL', status: 500 as const }
      }

      const imageUrl = imageCloud || (await saveUploadedFile(imageFile, 'groups'))
      const coverUrl = coverCloud || (await saveUploadedFile(coverImageFile, 'groups'))

      // Create group
      const newGroup = await Group.create({
        name,
        slug,
        description: description || undefined,
        image: imageUrl,
        coverImage: coverUrl,
        isPublic,
        isApprovalRequired,
        category: category || undefined,
        tags,
        creatorId: new mongoose.Types.ObjectId(session.id),
        memberCount: 1,
      })

      // Add creator as admin
      await GroupMember.create({
        groupId: newGroup._id,
        userId: new mongoose.Types.ObjectId(session.id),
        role: 'admin',
        status: 'active',
      })

      return await Group.findById(newGroup._id)
        .populate('creatorId', 'name image')
        .lean()
    })

    if (isCreateGroupError(group)) {
      return NextResponse.json(
        { error: group.error },
        { status: group.status }
      )
    }

    if (!group) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CREATE_FAILED },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...group,
      id: (group as any)._id.toString(),
    }, { status: 201 })
  } catch (error) {
    const mongoCode = (error as any)?.code
    if (mongoCode === 11000) {
      return NextResponse.json(
        { error: 'اسم المستخدم للجروب مستخدم بالفعل' },
        { status: 400 }
      )
    }
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.CREATE_FAILED },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    const groups = await withDB(async () => {
      let query: any = { isPublic: true }

      if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        query.$or = [
          { name: regex },
          { description: regex },
          { tags: { $in: [regex] } },
        ]
      }

      if (category) {
        query.category = category
      }

      const found = await Group.find(query)
        .populate('creatorId', 'name image')
        .sort({ memberCount: -1, createdAt: -1 })
        .limit(limit)
        .lean()

      return found.map((g: any) => ({
        ...g,
        id: g._id.toString(),
        creator: g.creatorId,
      }))
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'
import crypto from 'crypto'

export const runtime = 'nodejs'

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
  // cloudinary://<api_key>:<api_secret>@<cloud_name>
  try {
    const u = new URL('http://' + cloudinaryUrl.slice('cloudinary://'.length))
    const cloud_name = u.hostname
    const api_key = decodeURIComponent(u.username || '')
    const api_secret = decodeURIComponent(u.password || '')
    if (!cloud_name || !api_key || !api_secret) return null
    // guard against placeholders like <API_KEY>
    if ([cloud_name, api_key, api_secret].some((v) => v.includes('<') || v.includes('>'))) return null
    return { cloud_name, api_key, api_secret }
  } catch {
    return null
  }
}

async function uploadToCloudinary(file: File) {
  const cloudinaryUrl = process.env.CLOUDINARY_URL
  if (!cloudinaryUrl) return null

  const parsed = parseCloudinaryUrl(cloudinaryUrl)
  if (!parsed) return null

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = process.env.CLOUDINARY_FOLDER || 'otakuzone/posts'
  const publicId = randomUUID()

  // Cloudinary signature: sha1 of sorted params joined with '&' + api_secret
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
  if (!response.ok) {
    return null
  }

  return data?.secure_url || null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 })
    }

    // 10MB images limit (can be raised later)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'حجم الصورة كبير جداً (الحد الأقصى 10MB)' }, { status: 400 })
    }

    const cloudUrl = await uploadToCloudinary(file)

    // On Vercel/production: do not write to local filesystem (ephemeral)
    if (!cloudUrl && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Cloudinary غير مُعد. يرجى ضبط CLOUDINARY_URL' }, { status: 500 })
    }

    const url = cloudUrl || (await saveUploadedFile(file, 'posts'))

    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    console.error('Error uploading image:', error)
    const message = (error as any)?.message ? String((error as any).message) : 'تعذر رفع الصورة'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

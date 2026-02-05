import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import GroupLog from '@/models/GroupLog'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id)
}

async function requireModeratorOrAdmin(groupId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const m = await GroupMember.findOne({ groupId, userId, status: 'active' }).select('role').lean()
  const role = m?.role
  if (role !== 'admin' && role !== 'moderator') return null
  return role
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupIdRaw = String(searchParams.get('groupId') || '').trim()

    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 50)

    if (!groupIdRaw || !mongoose.Types.ObjectId.isValid(groupIdRaw)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const groupId = toObjectId(groupIdRaw)
      const actorId = toObjectId(session.id)

      const group = await Group.findById(groupId).select('_id').lean()
      if (!group) return { error: 'المجتمع غير موجود', status: 404 as const }

      const role = await requireModeratorOrAdmin(groupId, actorId)
      if (!role) return { error: 'غير مصرح', status: 403 as const }

      const [total, logs] = await Promise.all([
        GroupLog.countDocuments({ groupId }),
        GroupLog.find({ groupId })
          .populate('actorId', 'name image')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ])

      const items = (logs || []).map((l: any) => ({
        id: String(l._id),
        action: l.action,
        createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : null,
        actor: l.actorId ? { id: String(l.actorId._id), name: l.actorId.name || null, image: l.actorId.image || null } : null,
        targetUserId: l.targetUserId ? String(l.targetUserId) : null,
        targetTopicId: l.targetTopicId ? String(l.targetTopicId) : null,
        meta: l.meta ?? null,
      }))

      return {
        items,
        total,
        skip,
        limit,
        hasMore: skip + items.length < total,
        nextSkip: skip + items.length,
      }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching group logs:', error)
    return NextResponse.json({ error: 'تعذر تحميل السجل' }, { status: 500 })
  }
}

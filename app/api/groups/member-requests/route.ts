import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import GroupLog from '@/models/GroupLog'
import mongoose from 'mongoose'
import { getSession } from '@/lib/auth'

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
    const groupId = String(searchParams.get('groupId') || '').trim()

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const gid = toObjectId(groupId)
      const uid = toObjectId(session.id)

      const role = await requireModeratorOrAdmin(gid, uid)
      if (!role) return { error: 'غير مصرح', status: 403 as const }

      const pending = await GroupMember.find({ groupId: gid, status: 'pending' })
        .populate('userId', 'name image')
        .sort({ createdAt: -1 })
        .lean()

      return {
        role,
        requests: pending.map((m: any) => ({
          id: m._id.toString(),
          user: m.userId,
          userId: m.userId?._id?.toString?.() || m.userId?.toString?.(),
          createdAt: m.createdAt,
        })),
      }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching member requests:', error)
    return NextResponse.json({ error: 'تعذر جلب طلبات الانضمام' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const groupId = String(body?.groupId || '').trim()
    const userId = String(body?.userId || '').trim()
    const action = String(body?.action || '').trim()

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'deny') {
      return NextResponse.json({ error: 'action must be approve or deny' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const gid = toObjectId(groupId)
      const actorId = toObjectId(session.id)
      const targetUserId = toObjectId(userId)

      const role = await requireModeratorOrAdmin(gid, actorId)
      if (!role) return { error: 'غير مصرح', status: 403 as const }

      const group = await Group.findById(gid).select('_id memberCount').lean()
      if (!group) return { error: 'المجتمع غير موجود', status: 404 as const }

      const membership = await GroupMember.findOne({ groupId: gid, userId: targetUserId }).select('status').lean()
      if (!membership || membership.status !== 'pending') {
        return { error: 'لا يوجد طلب انضمام قيد الانتظار لهذا المستخدم', status: 400 as const }
      }

      if (action === 'approve') {
        await GroupMember.updateOne(
          { groupId: gid, userId: targetUserId },
          { $set: { status: 'active', joinedAt: new Date() } }
        )

        await Group.updateOne({ _id: gid }, { $inc: { memberCount: 1 } })

        await GroupLog.create({
          groupId: gid,
          actorId,
          action: 'member_request_approved',
          targetUserId,
        })

        return { ok: true }
      }

      await GroupMember.deleteOne({ groupId: gid, userId: targetUserId })

      await GroupLog.create({
        groupId: gid,
        actorId,
        action: 'member_request_denied',
        targetUserId,
      })

      return { ok: true }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error moderating member request:', error)
    return NextResponse.json({ error: 'تعذر تحديث طلب الانضمام' }, { status: 500 })
  }
}

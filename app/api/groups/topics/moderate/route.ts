import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import GroupTopic from '@/models/GroupTopic'
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const groupIdRaw = String(body?.groupId || '').trim()
    const topicIdRaw = String(body?.topicId || '').trim()
    const action = String(body?.action || '').trim()

    if (!groupIdRaw || !mongoose.Types.ObjectId.isValid(groupIdRaw)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    if (!topicIdRaw || !mongoose.Types.ObjectId.isValid(topicIdRaw)) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const groupId = toObjectId(groupIdRaw)
      const actorId = toObjectId(session.id)
      const topicId = toObjectId(topicIdRaw)

      const role = await requireModeratorOrAdmin(groupId, actorId)
      if (!role) return { error: 'غير مصرح', status: 403 as const }

      const group = await Group.findById(groupId).select('_id topicCount').lean()
      if (!group) return { error: 'المجتمع غير موجود', status: 404 as const }

      const topic = await GroupTopic.findOne({ _id: topicId, groupId }).select('status').lean()
      if (!topic) return { error: 'المنشور غير موجود', status: 404 as const }

      if (topic.status !== 'pending') {
        return { error: 'هذا المنشور ليس قيد المراجعة', status: 400 as const }
      }

      if (action === 'approve') {
        await GroupTopic.updateOne(
          { _id: topicId, groupId },
          { $set: { status: 'published', approvedBy: actorId, approvedAt: new Date() } }
        )

        await Group.updateOne({ _id: groupId }, { $inc: { topicCount: 1 } })

        await GroupLog.create({
          groupId,
          actorId,
          action: 'group_post_approved',
          targetTopicId: topicId,
        })

        return { ok: true }
      }

      await GroupTopic.updateOne(
        { _id: topicId, groupId },
        { $set: { status: 'rejected', approvedBy: actorId, approvedAt: new Date() } }
      )

      await GroupLog.create({
        groupId,
        actorId,
        action: 'group_post_rejected',
        targetTopicId: topicId,
      })

      return { ok: true }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error moderating group topic:', error)
    return NextResponse.json({ error: 'تعذر تحديث حالة المنشور' }, { status: 500 })
  }
}

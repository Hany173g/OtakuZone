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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ membership: null })
    }

    const { searchParams } = new URL(request.url)
    const groupId = String(searchParams.get('groupId') || '').trim()

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    const membership = await withDB(async () => {
      const m = await GroupMember.findOne({
        groupId: toObjectId(groupId),
        userId: toObjectId(session.id),
      })
        .select('role status createdAt joinedAt')
        .lean()

      if (!m) return null

      return {
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
        joinedAt: m.joinedAt,
      }
    })

    return NextResponse.json({ membership })
  } catch (error) {
    console.error('Error fetching group membership:', error)
    return NextResponse.json({ error: 'تعذر جلب حالة العضوية' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const groupId = String(body?.groupId || '').trim()

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    const result = await withDB(async () => {
      const gid = toObjectId(groupId)
      const uid = toObjectId(session.id)

      const group = await Group.findById(gid).select('isPublic isApprovalRequired memberCount').lean()
      if (!group) {
        return { error: 'المجتمع غير موجود', status: 404 as const }
      }

      const existing = await GroupMember.findOne({ groupId: gid, userId: uid }).select('status role').lean()
      if (existing) {
        return {
          membership: { status: existing.status, role: existing.role },
          status: 200 as const,
        }
      }

      const joinStatus: 'active' | 'pending' = group.isPublic && !group.isApprovalRequired ? 'active' : 'pending'

      await GroupMember.create({
        groupId: gid,
        userId: uid,
        role: 'member',
        status: joinStatus,
      })

      if (joinStatus === 'active') {
        await Group.updateOne({ _id: gid }, { $inc: { memberCount: 1 } })
      }

      await GroupLog.create({
        groupId: gid,
        actorId: uid,
        action: joinStatus === 'active' ? 'member_joined' : 'member_requested',
      })

      return {
        membership: { status: joinStatus, role: 'member' },
        status: 201 as const,
      }
    })

    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status || 400 })
    }

    return NextResponse.json({ membership: (result as any).membership }, { status: (result as any).status || 200 })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json({ error: 'تعذر إرسال طلب الانضمام' }, { status: 500 })
  }
}

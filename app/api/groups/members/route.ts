import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
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
    const q = String(searchParams.get('q') || '').trim()

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

      const match: any = { groupId, status: 'active' }

      const nameRegex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null

      const basePipeline: any[] = [
        { $match: match },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
      ]

      if (nameRegex) {
        basePipeline.push({ $match: { 'user.name': nameRegex } })
      }

      const countPipeline = [...basePipeline, { $count: 'total' }]

      const dataPipeline = [
        ...basePipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            role: 1,
            status: 1,
            joinedAt: 1,
            createdAt: 1,
            user: { _id: '$user._id', name: '$user.name', image: '$user.image' },
          },
        },
      ]

      const [countRes, members] = await Promise.all([
        GroupMember.aggregate(countPipeline),
        GroupMember.aggregate(dataPipeline),
      ])

      const total = Number(countRes?.[0]?.total || 0)
      const items = (members || []).map((m: any) => ({
        id: String(m._id),
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString() : null,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
        user: m.user
          ? {
              id: String(m.user._id),
              name: m.user.name || null,
              image: m.user.image || null,
            }
          : null,
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
    console.error('Error fetching group members:', error)
    return NextResponse.json({ error: 'تعذر تحميل الأعضاء' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Conversation from '@/models/Conversation'
import Message from '@/models/Message'
import User from '@/models/User'
import Notification from '@/models/Notification'
import Block from '@/models/Block'
import UserFollow from '@/models/UserFollow'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'

async function canMessage(senderId: mongoose.Types.ObjectId, receiverId: mongoose.Types.ObjectId) {
  const [blockedEither, receiver] = await Promise.all([
    Block.findOne({
      $or: [
        { blockerId: senderId, blockedId: receiverId },
        { blockerId: receiverId, blockedId: senderId },
      ],
    })
      .select('_id')
      .lean(),
    User.findById(receiverId)
      .select('profileVisibility allowMessages')
      .lean(),
  ])

  if (blockedEither) {
    return { ok: false as const, status: 403, error: 'لا يمكنك مراسلة هذا المستخدم' }
  }

  if (!receiver) {
    return { ok: false as const, status: 404, error: 'لم يتم العثور على المستخدم' }
  }

  if (receiver.allowMessages === false) {
    return { ok: false as const, status: 403, error: 'هذا المستخدم لا يسمح بالرسائل' }
  }

  if (receiver.profileVisibility === 'public') {
    return { ok: true as const }
  }

  const [aFollowsB, bFollowsA] = await Promise.all([
    UserFollow.findOne({ followerId: senderId, followingId: receiverId }).select('_id').lean(),
    UserFollow.findOne({ followerId: receiverId, followingId: senderId }).select('_id').lean(),
  ])

  if (aFollowsB && bFollowsA) {
    return { ok: true as const }
  }

  return { ok: false as const, status: 403, error: 'لا يمكنك مراسلة هذا المستخدم إلا إذا كنتم أصدقاء' }
}

export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    const result = await withDB(async () => {
      const myId = new mongoose.Types.ObjectId(session.id)
      const convId = new mongoose.Types.ObjectId(params.conversationId)

      const conv = await Conversation.findById(convId).lean()
      if (!conv) return { error: 'المحادثة غير موجودة', status: 404 as const }

      const isParticipant = (conv.participants || []).some((p: any) => p.toString() === myId.toString())
      if (!isParticipant) return { error: 'غير مصرح', status: 403 as const }

      const messages = await Message.find({ conversationId: convId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()

      return {
        messages: messages
          .reverse()
          .map((m: any) => ({
            id: m._id.toString(),
            conversationId: m.conversationId.toString(),
            senderId: m.senderId.toString(),
            text: m.text,
            createdAt: m.createdAt,
          })),
      }
    })

    if ((result as any).error) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.FETCH_FAILED }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json()
    const text = String(body?.text || '').trim()

    if (!text) {
      return NextResponse.json({ error: 'نص الرسالة مطلوب' }, { status: 400 })
    }

    const created = await withDB(async () => {
      const myId = new mongoose.Types.ObjectId(session.id)
      const convId = new mongoose.Types.ObjectId(params.conversationId)

      const conv = await Conversation.findById(convId).lean()
      if (!conv) return { error: 'المحادثة غير موجودة', status: 404 as const }

      const isParticipant = (conv.participants || []).some((p: any) => p.toString() === myId.toString())
      if (!isParticipant) return { error: 'غير مصرح', status: 403 as const }

      const otherIdRaw = (conv.participants || []).find((p: any) => p.toString() !== myId.toString())
      if (!otherIdRaw) return { error: 'محادثة غير صالحة', status: 400 as const }

      const otherId = new mongoose.Types.ObjectId(otherIdRaw)

      const perm = await canMessage(myId, otherId)
      if (!perm.ok) {
        return { error: perm.error, status: perm.status as number }
      }

      const msg = await Message.create({
        conversationId: convId,
        senderId: myId,
        text,
      })

      await Conversation.updateOne({ _id: convId }, { $set: { updatedAt: new Date() } })

      const out = {
        id: msg._id.toString(),
        conversationId: convId.toString(),
        senderId: myId.toString(),
        text: msg.text,
        createdAt: msg.createdAt,
      }

      const sender = await User.findById(myId).select('name').lean()
      const senderName = (sender as any)?.name || 'مستخدم'

      const notif = await Notification.create({
        userId: otherId,
        type: 'message',
        message: `رسالة جديدة من ${senderName}`,
        link: `/messages/${convId.toString()}`,
        relatedUserId: myId,
      })

      const notifOut = {
        id: notif._id.toString(),
        type: notif.type,
        message: notif.message,
        read: false,
        link: notif.link,
        createdAt: notif.createdAt,
      }

      try {
        if (global.io) {
          global.io.to(`user:${myId.toString()}`).emit('message:new', out)
          global.io.to(`user:${otherId.toString()}`).emit('message:new', out)
          global.io.to(`user:${otherId.toString()}`).emit('notification:new', notifOut)
        }
      } catch {
        // ignore
      }

      return { message: out, status: 201 }
    })

    if ((created as any).error) {
      return NextResponse.json({ error: (created as any).error }, { status: (created as any).status })
    }

    return NextResponse.json((created as any).message, { status: (created as any).status })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.CREATE_FAILED }, { status: 500 })
  }
}

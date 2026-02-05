import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Conversation from '@/models/Conversation'
import Message from '@/models/Message'
import User from '@/models/User'
import Block from '@/models/Block'
import UserFollow from '@/models/UserFollow'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'

function participantsKey(a: string, b: string) {
  return [String(a), String(b)].sort().join(':')
}

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

  // Requirement: private accounts can be messaged by friends only (mutual follow)
  const [aFollowsB, bFollowsA] = await Promise.all([
    UserFollow.findOne({ followerId: senderId, followingId: receiverId }).select('_id').lean(),
    UserFollow.findOne({ followerId: receiverId, followingId: senderId }).select('_id').lean(),
  ])

  if (aFollowsB && bFollowsA) {
    return { ok: true as const }
  }

  return { ok: false as const, status: 403, error: 'لا يمكنك مراسلة هذا المستخدم إلا إذا كنتم أصدقاء' }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const result = await withDB(async () => {
      const myId = new mongoose.Types.ObjectId(session.id)

      const conversations = await Conversation.find({ participants: myId })
        .sort({ updatedAt: -1 })
        .lean()

      const convsWithMeta = await Promise.all(
        conversations.map(async (c: any) => {
          const otherId = c.participants.find((p: any) => p.toString() !== myId.toString())
          const [otherUser, lastMessage] = await Promise.all([
            otherId ? User.findById(otherId).select('name image profileVisibility allowMessages').lean() : null,
            Message.findOne({ conversationId: c._id }).sort({ createdAt: -1 }).lean(),
          ])

          return {
            id: c._id.toString(),
            otherUser: otherUser
              ? {
                  id: otherUser._id.toString(),
                  name: otherUser.name || null,
                  image: otherUser.image || null,
                  profileVisibility: otherUser.profileVisibility,
                  allowMessages: otherUser.allowMessages,
                }
              : null,
            lastMessage: lastMessage
              ? {
                  id: lastMessage._id.toString(),
                  text: lastMessage.text,
                  senderId: lastMessage.senderId.toString(),
                  createdAt: lastMessage.createdAt,
                }
              : null,
            updatedAt: c.updatedAt,
          }
        })
      )

      return { conversations: convsWithMeta }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.FETCH_FAILED }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    if (String(userId) === String(session.id)) {
      return NextResponse.json({ error: 'لا يمكنك بدء محادثة مع نفسك' }, { status: 400 })
    }

    const conv = await withDB(async () => {
      const me = new mongoose.Types.ObjectId(session.id)
      const other = new mongoose.Types.ObjectId(userId)

      const perm = await canMessage(me, other)
      if (!perm.ok) {
        return { error: perm.error, status: perm.status as number }
      }

      const key = participantsKey(me.toString(), other.toString())

      const existing = await Conversation.findOne({ participantsKey: key }).lean()
      if (existing) {
        return { conversation: existing, status: 200 }
      }

      const created = await Conversation.create({
        participants: [me, other],
        participantsKey: key,
      })

      return { conversation: created.toObject(), status: 201 }
    })

    if ((conv as any).error) {
      return NextResponse.json({ error: (conv as any).error }, { status: (conv as any).status })
    }

    return NextResponse.json(
      {
        conversation: {
          id: (conv as any).conversation._id.toString(),
          participants: (conv as any).conversation.participants?.map((p: any) => p.toString()),
        },
      },
      { status: (conv as any).status }
    )
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.CREATE_FAILED }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Block from '@/models/Block'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'
import { ERROR_MESSAGES } from '@/lib/validation-ar'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const blocks = await withDB(async () => {
      const myId = new mongoose.Types.ObjectId(session.id)
      const docs = await Block.find({ blockerId: myId })
        .populate('blockedId', 'name image')
        .sort({ createdAt: -1 })
        .lean()

      return docs.map((b: any) => ({
        id: b._id.toString(),
        blocked: {
          id: b.blockedId?._id?.toString?.() || b.blockedId?.toString?.() || '',
          name: b.blockedId?.name || null,
          image: b.blockedId?.image || null,
        },
        createdAt: b.createdAt,
      }))
    })

    return NextResponse.json({ blocks })
  } catch (error) {
    console.error('Error fetching blocks:', error)
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
      return NextResponse.json({ error: 'لا يمكنك حظر نفسك' }, { status: 400 })
    }

    await withDB(async () => {
      await Block.updateOne(
        {
          blockerId: new mongoose.Types.ObjectId(session.id),
          blockedId: new mongoose.Types.ObjectId(userId),
        },
        {
          $setOnInsert: {
            blockerId: new mongoose.Types.ObjectId(session.id),
            blockedId: new mongoose.Types.ObjectId(userId),
          },
        },
        { upsert: true }
      )
    })

    return NextResponse.json({ blocked: true }, { status: 201 })
  } catch (error: any) {
    console.error('Error blocking user:', error)
    if (error?.code === 11000) {
      return NextResponse.json({ blocked: true }, { status: 200 })
    }
    return NextResponse.json({ error: ERROR_MESSAGES.CREATE_FAILED }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    await withDB(async () => {
      await Block.deleteOne({
        blockerId: new mongoose.Types.ObjectId(session.id),
        blockedId: new mongoose.Types.ObjectId(userId),
      })
    })

    return NextResponse.json({ blocked: false })
  } catch (error) {
    console.error('Error unblocking user:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.DELETE_FAILED }, { status: 500 })
  }
}

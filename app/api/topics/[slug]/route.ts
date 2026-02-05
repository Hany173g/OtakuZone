import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models'
import Topic from '@/models/Topic'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import Dislike from '@/models/Dislike'
import Notification from '@/models/Notification'
import TopicView from '@/models/TopicView'
import Favorite from '@/models/Favorite'
import Follow from '@/models/Follow'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const { slug } = params
    if (!slug) {
      return NextResponse.json({ error: 'معرف الموضوع مطلوب' }, { status: 400 })
    }

    const result = await withDB(async () => {
      // Find the topic
      const topic = await Topic.findOne({ slug }).lean()
      if (!topic) {
        return { error: 'الموضوع غير موجود', status: 404 }
      }

      // Check if user is the owner
      const authorId = String(topic.authorId)
      const userId = String(session.id)
      
      if (authorId !== userId) {
        // Only owner can delete
        return { error: 'لا يمكنك حذف هذا الموضوع', status: 403 }
      }

      const topicId = topic._id

      // Cascade delete - delete all related data
      await Promise.all([
        // Delete all comments
        Comment.deleteMany({ topicId }),
        
        // Delete all likes
        Like.deleteMany({ topicId }),
        
        // Delete all dislikes
        Dislike.deleteMany({ topicId }),
        
        // Delete all topic views
        TopicView.deleteMany({ topicId }),
        
        // Delete from favorites
        Favorite.deleteMany({ topicId }),
        
        // Delete follow relationships for this topic
        Follow.deleteMany({ topicId }),
        
        // Delete related notifications
        Notification.deleteMany({ relatedTopicId: topicId }),
        
        // Finally, delete the topic
        Topic.deleteOne({ _id: topicId }),
      ])

      return { success: true, message: 'تم حذف الموضوع وكل البيانات المرتبطة به' }
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting topic:', error)
    return NextResponse.json({ error: 'تعذر حذف الموضوع' }, { status: 500 })
  }
}

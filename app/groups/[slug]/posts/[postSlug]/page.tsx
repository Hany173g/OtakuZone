import { withDB } from '@/lib/db'
import '@/models'
import Group from '@/models/Group'
import GroupMember from '@/models/GroupMember'
import GroupTopic from '@/models/GroupTopic'
import GroupComment from '@/models/GroupComment'
import Like from '@/models/Like'
import Dislike from '@/models/Dislike'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import LikeButton from '@/components/LikeButton'
import GroupCommentSection from '@/components/GroupCommentSection'
import MarkSeen from '@/components/MarkSeen'
import mongoose from 'mongoose'
import { getVideoEmbedUrl } from '@/lib/video'

export default async function GroupPostPage(props: { params: { slug: string; postSlug: string } }) {
  const session = await getSession()

  const data = await withDB(async () => {
    const group = await Group.findOne({ slug: props.params.slug }).select('name slug isPublic settings').lean()
    if (!group) return null

    let role: string | null = null
    if (session?.id) {
      const membership = await GroupMember.findOne({
        groupId: (group as any)._id,
        userId: new mongoose.Types.ObjectId(session.id),
        status: 'active',
      })
        .select('role')
        .lean()
      role = (membership as any)?.role || null
    }

    if (!(group as any).isPublic && !role) {
      return { group: null, topic: null }
    }

    const topic = await GroupTopic.findOne({
      groupId: (group as any)._id,
      slug: props.params.postSlug,
      status: 'published',
    })
      .populate('authorId', 'name image')
      .populate('categoryId')
      .lean()

    if (!topic) return { group: null, topic: null }

    const [commentCount, likeCount, dislikeCount] = await Promise.all([
      GroupComment.countDocuments({ groupTopicId: (topic as any)._id }),
      Like.countDocuments({ groupTopicId: (topic as any)._id }),
      Dislike.countDocuments({ groupTopicId: (topic as any)._id }),
    ])

    const author = (topic as any).isAnonymous
      ? { name: (topic as any).anonymousName || 'مجهول', image: null }
      : ((topic as any).authorId
          ? {
              id: String(((topic as any).authorId as any)._id),
              name: ((topic as any).authorId as any).name,
              image: ((topic as any).authorId as any).image || null,
            }
          : null)

    return {
      group: {
        id: String((group as any)._id),
        name: (group as any).name,
        slug: (group as any).slug,
      },
      topic: {
        ...(topic as any),
        id: String((topic as any)._id),
        author,
        createdAt: (topic as any).createdAt ? new Date((topic as any).createdAt).toISOString() : undefined,
        _count: { comments: commentCount, likes: likeCount, dislikes: dislikeCount },
      },
    }
  })

  if (!data?.group || !data?.topic) {
    notFound()
  }

  const createdAt = data.topic.createdAt ? new Date(data.topic.createdAt) : new Date()
  const videoEmbedUrl = getVideoEmbedUrl((data.topic as any).videoUrl)

  return (
    <div className="container mx-auto px-4 py-8">
      <MarkSeen kind="groupTopic" id={data.topic.id} />
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        <Link href={`/groups/${data.group.slug}`} className="hover:text-anime-purple transition">
          {data.group.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 dark:text-slate-100 font-semibold">منشور</span>
      </div>

      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-xs font-semibold bg-anime-purple/10 text-anime-purple px-2 py-1 rounded">
                {data.group.name}
              </span>
              <span className="text-xs font-semibold bg-anime-blue/10 text-anime-blue px-2 py-1 rounded">
                {(data.topic.categoryId as any)?.name || 'عام'}
              </span>
            </div>

            <h1 className="mt-2 text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 break-words">
              {data.topic.title}
            </h1>

            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
              {data.topic.author?.id ? (
                <Link href={`/profile/${data.topic.author.id}`} className="inline-flex items-center gap-2 hover:text-anime-purple transition">
                  <img src={data.topic.author?.image || '/default-avatar.svg'} alt={data.topic.author?.name || 'User'} className="w-6 h-6 rounded-full" />
                  <span>{data.topic.author?.name || 'مستخدم'}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <img src={data.topic.author?.image || '/default-avatar.svg'} alt={data.topic.author?.name || 'User'} className="w-6 h-6 rounded-full" />
                  <span>{data.topic.author?.name || 'مستخدم'}</span>
                </span>
              )}
              <span className="mx-2">•</span>
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </div>
          </div>

          <LikeButton
            groupTopicId={data.topic.id}
            initialLikes={(data.topic._count as any)?.likes || 0}
            initialDislikes={(data.topic._count as any)?.dislikes || 0}
            layout="row"
          />
        </div>

        {data.topic.imageUrl ? (
          <div className="mt-4 relative h-72 md:h-[440px] overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
            <img
              src={data.topic.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
            />
            <img src={data.topic.imageUrl} alt={data.topic.title} className="relative w-full h-full object-contain" />
          </div>
        ) : null}

        {videoEmbedUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-black/5">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={videoEmbedUrl}
                title={data.topic.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        ) : null}

        <div
          className="prose prose-lg max-w-none mt-6 dark:prose-invert break-words"
          dangerouslySetInnerHTML={{ __html: String(data.topic.content || '') }}
        />
      </div>

      <GroupCommentSection groupTopicId={data.topic.id} />
    </div>
  )
}

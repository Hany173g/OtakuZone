import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Topic from '@/models/Topic'
import Category from '@/models/Category'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import Dislike from '@/models/Dislike'
import TopicView from '@/models/TopicView'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Eye, Pin, Lock, TrendingUp, Film, Book, BookOpen, BarChart3 } from 'lucide-react'
import CommentSection from '@/components/CommentSection'
import LikeButton from '@/components/LikeButton'
import ShareButtons from '@/components/ShareButtons'
import FollowButton from '@/components/FollowButton'
import FavoriteButton from '@/components/FavoriteButton'
import LinkPreviewList from '@/components/LinkPreviewList'
import MarkSeen from '@/components/MarkSeen'
import { getSession } from '@/lib/auth'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { getVideoEmbedUrl } from '@/lib/video'
import DeleteTopicButton from '@/components/DeleteTopicButton'

interface TopicPageProps {
  params: {
    slug: string
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const topic = await withDB(async () => {
    return Topic.findOne({ slug: params.slug }).select('title content imageUrl createdAt').lean()
  })

  if (!topic) {
    return {
      title: 'المقال غير موجود | OtakuZone',
    }
  }

  const description = stripHtml(topic.content || '').slice(0, 160)
  const url = `${siteUrl}/topic/${params.slug}`
  const image = (topic as any).imageUrl

  return {
    title: `${topic.title} | OtakuZone`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: topic.title,
      description,
      url,
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: topic.title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

const typeLabels: Record<string, { label: string; icon: any }> = {
  anime: { label: 'أنمي', icon: Film },
  manga: { label: 'مانجا', icon: Book },
  manhwa: { label: 'مانهوا', icon: BookOpen },
}

export default async function TopicPage({ params }: TopicPageProps) {
  const session = await getSession()
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ip = (forwardedFor?.split(',')[0] || realIp || 'unknown').trim()
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex')
  const day = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  
  const topic = await withDB(async () => {
    let slug = params.slug
    if (typeof slug === 'string' && slug.includes('%')) {
      try {
        slug = decodeURIComponent(slug)
      } catch {
        // ignore
      }
    }

    let foundTopic = await Topic.findOne({ slug })
      .populate('authorId', 'name image id')
      .populate('categoryId')
      .lean()

    console.log('[PAGE DEBUG] foundTopic.videoUrl:', (foundTopic as any)?.videoUrl)

    if (!foundTopic && slug !== params.slug) {
      foundTopic = await Topic.findOne({ slug: params.slug })
        .populate('authorId', 'name image id')
        .populate('categoryId')
        .lean()
    }

    if (!foundTopic) {
      return null
    }

    // Increment views ONCE per IP per day (avoid refresh spam)
    try {
      await TopicView.create({
        topicId: foundTopic._id,
        ipHash,
        day,
      })
      await Topic.updateOne({ _id: foundTopic._id }, { $inc: { views: 1 } })
    } catch (e) {
      // Duplicate => already counted today
    }

    // Get comments
    const comments = await Comment.find({
      topicId: foundTopic._id,
      parentId: null,
    })
      .populate('authorId', 'name image id')
      .sort({ createdAt: 1 })
      .lean()

    const commentsWithCounts = await Promise.all(
      comments.map(async (comment: any) => {
        const [likeCount, replyCount] = await Promise.all([
          Like.countDocuments({ commentId: comment._id }),
          Comment.countDocuments({ parentId: comment._id }),
        ])

        return {
          ...comment,
          id: comment._id.toString(),
          author: comment.authorId,
          replies: [],
          _count: {
            likes: likeCount,
            replies: replyCount,
          },
        }
      })
    )

    const [commentCount, likeCount, dislikeCount] = await Promise.all([
      Comment.countDocuments({ topicId: foundTopic._id }),
      Like.countDocuments({ topicId: foundTopic._id }),
      Dislike.countDocuments({ topicId: foundTopic._id }),
    ])

    return {
      ...foundTopic,
      id: foundTopic._id.toString(),
      author: foundTopic.authorId,
      category: foundTopic.categoryId,
      videoUrl: (foundTopic as any).videoUrl,
      imageUrl: (foundTopic as any).imageUrl,
      comments: commentsWithCounts,
      _count: {
        comments: commentCount,
        likes: likeCount,
        dislikes: dislikeCount,
      },
    }
  })

  if (!topic) {
    notFound()
  }

  const typeInfo = typeLabels[topic.type as string] || { label: topic.type, icon: Film }
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const videoEmbedUrl = getVideoEmbedUrl((topic as any).videoUrl)
  console.log('[DEBUG] Topic videoUrl:', (topic as any).videoUrl, '| Embed URL:', videoEmbedUrl)
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: topic.title,
    description: stripHtml((topic as any).content || '').slice(0, 160),
    datePublished: topic.createdAt,
    dateModified: (topic as any).updatedAt || topic.createdAt,
    author: {
      '@type': 'Person',
      name: (topic.author as any)?.name || 'مستخدم',
    },
    image: (topic as any).imageUrl ? [(topic as any).imageUrl] : undefined,
    mainEntityOfPage: `${siteUrl}/topic/${topic.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'OtakuZone',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <MarkSeen kind="topic" id={topic.id} />
      {/* Topic Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-8 mb-6 border border-transparent dark:border-slate-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {topic.isPinned && (
              <span className="flex items-center gap-1 text-anime-orange text-sm bg-orange-50 px-3 py-1 rounded-full">
                <Pin className="w-4 h-4" />
                مثبت
              </span>
            )}
            {topic.isPopular && (
              <span className="flex items-center gap-1 text-anime-pink text-sm bg-pink-50 px-3 py-1 rounded-full">
                <TrendingUp className="w-4 h-4" />
                شائع
              </span>
            )}
            {topic.isLocked && (
              <span className="flex items-center gap-1 text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                <Lock className="w-4 h-4" />
                مغلق
              </span>
            )}
            <span className="flex items-center gap-1 text-anime-purple text-sm bg-purple-50 px-3 py-1 rounded-full">
              <typeInfo.icon className="w-4 h-4" />
              {typeInfo.label}
            </span>
            <span className="text-sm bg-anime-blue/10 text-anime-blue px-3 py-1 rounded-full">
              {(topic.category as any)?.name || 'عام'}
            </span>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100 mb-4">{topic.title}</h1>

        {/* Topic Content - under title */}
        <div
          className="prose prose-lg max-w-none mb-6 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: topic.content }}
        />

        {(topic as any).imageUrl ? (
          <div className="mb-6 relative h-72 md:h-[440px] overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
            <img
              src={(topic as any).imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-40"
            />
            <img
              src={(topic as any).imageUrl}
              alt={topic.title}
              className="relative w-full h-full object-contain"
            />
          </div>
        ) : null}

        {videoEmbedUrl ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-black/5">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={videoEmbedUrl}
                title={topic.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        ) : null}

        {/* Topic Meta */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {(topic.author as any)?.image && (
              <img
                src={(topic.author as any).image}
                alt={(topic.author as any)?.name || 'User'}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-gray-800 dark:text-slate-100">{(topic.author as any)?.name || 'مجهول'}</p>
              <p className="text-sm text-gray-500 dark:text-slate-300" suppressHydrationWarning>
                {formatDistanceToNow(new Date(topic.createdAt), {
                  addSuffix: true
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-gray-600 dark:text-slate-300">
            {/* Dashboard Link for Admin */}
            {session?.role === 'admin' && (
              <Link
                href="/forum/dashboard"
                className="flex items-center gap-2 text-anime-purple hover:text-purple-700 font-semibold"
              >
                <BarChart3 className="w-5 h-5" />
                Dashboard المنتدى
              </Link>
            )}
            {/* Delete button for owner */}
            <DeleteTopicButton 
              slug={params.slug} 
              isOwner={session?.id === (topic.author as any)?.id} 
            />
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>{topic._count.comments}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <span>{topic.views}</span>
            </div>
            <LikeButton topicId={topic.id} initialLikes={topic._count.likes} initialDislikes={(topic._count as any).dislikes || 0} />
            {session && <FavoriteButton topicId={topic.id} />}
            {session && <FollowButton topicId={topic.id} userId={session.id} />}
          </div>
        </div>

        <LinkPreviewList html={topic.content} />

        {/* Share Buttons */}
        <div className="mt-8 pt-6 border-t">
          <ShareButtons
            title={topic.title}
            url={`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/topic/${topic.slug}`}
          />
        </div>
      </div>

      {/* Comments Section */}
      <CommentSection
        topicId={topic.id}
        topicAuthorId={(topic.author as any)?.id}
        comments={topic.comments}
        isLocked={topic.isLocked}
      />
    </div>
  )
}

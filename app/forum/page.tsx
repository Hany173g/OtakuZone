import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Topic from '@/models/Topic'
import Category from '@/models/Category'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import AdBanner from '@/components/AdBanner'
import { Flame, Clock, TrendingUp, Plus, Filter } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import TopicFeed from '@/components/TopicFeed'

interface ForumPageProps {
  searchParams: {
    category?: string
    filter?: string
    sort?: string
    type?: string
  }
}

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const { category, filter, sort, type } = searchParams
  const session = await getSession()

  const topics = await withDB(async () => {
    let query: any = {}

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category })
      if (categoryDoc) {
        query.categoryId = categoryDoc._id
      }
    }

    if (filter === 'popular') {
      query.isPopular = true
    } else if (filter === 'pinned') {
      query.isPinned = true
    }

    let sortQuery: any = { createdAt: -1 }
    if (sort === 'views') {
      sortQuery = { views: -1 }
    } else if (filter === 'popular') {
      sortQuery = { views: -1 }
    }

    const topics = await Topic.find(query)
      .populate('authorId', 'name image')
      .populate('categoryId')
      .sort(sortQuery)
      .limit(10)
      .lean()

    const topicsWithCounts = await Promise.all(
      topics.map(async (topic: any) => {
        const [commentCount, likeCount] = await Promise.all([
          Comment.countDocuments({ topicId: topic._id }),
          Like.countDocuments({ topicId: topic._id }),
        ])
        return {
          ...topic,
          id: topic._id.toString(),
          _count: {
            comments: commentCount,
            likes: likeCount,
          },
        }
      })
    )

    return topicsWithCounts
  })

  const safeTopics = JSON.parse(JSON.stringify(topics))

  const categories = await withDB(async () => {
    return await Category.find().sort({ name: 1 }).lean()
  })

  const tab = filter === 'popular' ? 'hot' : filter === 'pinned' ? 'top' : 'new'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">المنتدى</h1>
          <p className="mt-1 text-sm md:text-base text-slate-600 dark:text-slate-300">ناقش، قيّم، وشارك ترشيحاتك مع مجتمع عشاق الأنمي والمانجا والمانهوا</p>
        </div>

        {session ? (
          <Link
            href="/forum/new"
            className="flex items-center gap-2 bg-anime-purple text-white px-5 py-3 rounded-xl hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            موضوع جديد
          </Link>
        ) : (
          <Link
            href="/login?redirect=/forum/new"
            className="flex items-center gap-2 bg-slate-200 text-slate-800 px-5 py-3 rounded-xl hover:bg-slate-300 transition"
          >
            <Plus className="w-5 h-5" />
            سجل دخول
          </Link>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
        <div className="flex items-center gap-2">
          <Link
            href="/forum"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === 'new' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            جديد
          </Link>
          <Link
            href="/forum?filter=popular"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === 'hot' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            Hot
          </Link>
          <Link
            href="/forum?filter=pinned"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === 'top' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Top
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <TopicFeed initialItems={safeTopics} filter={filter as any} category={category} type={type} className="space-y-4" />
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">التصنيفات</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 12).map((cat: any) => (
                  <Link
                    key={cat._id || cat.id}
                    href={`/forum?category=${cat.slug}`}
                    className={`px-3 py-2 rounded-xl text-sm transition ${
                      category === cat.slug
                        ? 'bg-anime-purple text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/categories" className="text-sm font-semibold text-anime-purple hover:text-anime-pink">
                  عرض كل التصنيفات
                </Link>
              </div>
            </div>

            <AdBanner position="sidebar" className="" />
          </div>
        </aside>
      </div>
    </div>
  )
}

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { withDB } from '@/lib/db'
import '@/models'
import Topic from '@/models/Topic'
import Category from '@/models/Category'
import Comment from '@/models/Comment'
import Like from '@/models/Like'
import Dislike from '@/models/Dislike'
import Group from '@/models/Group'
import GroupTopic from '@/models/GroupTopic'
import GroupComment from '@/models/GroupComment'

// Dynamic imports for heavy components
const CategoryCard = dynamic(() => import('@/components/CategoryCard'), { ssr: true })
const AdBanner = dynamic(() => import('@/components/AdBanner'), { ssr: false })
const TopicFeed = dynamic(() => import('@/components/TopicFeed'), { ssr: true })
const GroupTopicList = dynamic(() => import('@/components/GroupTopicList'), { ssr: true })

// Categories will be fetched from database

const contentTypes = [
  { name: 'أنمي', slug: 'anime', icon: '🎬', description: 'مناقشة الأنمي والحلقات' },
  { name: 'مانجا', slug: 'manga', icon: '📚', description: 'مناقشة المانجا والفصول' },
  { name: 'مانهوا', slug: 'manhwa', icon: '📖', description: 'مناقشة المانهوا' },
]

export default async function Home() {
  // Fetch categories from database
  const categories = await withDB(async () => {
    const cats = await Category.find().lean()
    // ترتيب - نظريات أولاً
    return cats.sort((a: any, b: any) => {
      if (a.slug === 'theories') return -1
      if (b.slug === 'theories') return 1
      return a.name.localeCompare(b.name, 'ar')
    }).map((cat: any) => ({
      name: cat.name,
      slug: cat.slug,
      color: cat.color || '#6b7280',
    }))
  })

  const initialTopics = await withDB(async () => {
    const topics = await Topic.find()
      .populate('authorId', 'name image')
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    const topicsWithCounts = await Promise.all(
      topics.map(async (topic: any) => {
        const [commentCount, likeCount, dislikeCount] = await Promise.all([
          Comment.countDocuments({ topicId: topic._id }),
          Like.countDocuments({ topicId: topic._id }),
          Dislike.countDocuments({ topicId: topic._id }),
        ])
        return {
          ...topic,
          id: topic._id.toString(),
          _count: {
            comments: commentCount,
            likes: likeCount,
            dislikes: dislikeCount,
          },
        }
      })
    )

    return topicsWithCounts
  })

  const safeInitialTopics = JSON.parse(JSON.stringify(initialTopics))

  const publicGroupPosts = await withDB(async () => {
    const groups = await Group.find({ isPublic: true }).select('_id name slug image').lean()
    if (!groups.length) return []

    const groupMap = new Map(groups.map((g: any) => [String(g._id), { name: g.name, slug: g.slug, image: g.image }]))
    const groupIds = groups.map((g: any) => g._id)

    const posts = await GroupTopic.find({ groupId: { $in: groupIds }, status: 'published' })
      .populate('authorId', 'name image')
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()

    const enriched = await Promise.all(
      posts.map(async (t: any) => {
        const [commentCount, likeCount, dislikeCount] = await Promise.all([
          GroupComment.countDocuments({ groupTopicId: t._id }),
          Like.countDocuments({ groupTopicId: t._id }),
          Dislike.countDocuments({ groupTopicId: t._id }),
        ])
        const author = t.isAnonymous ? { name: t.anonymousName || 'مجهول', image: null } : (t.authorId || null)
        return {
          ...t,
          id: t._id.toString(),
          author,
          group: groupMap.get(String(t.groupId)) || null,
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
          _count: { comments: commentCount, likes: likeCount, dislikes: dislikeCount },
        }
      })
    )

    return enriched
  })

  const safePublicGroupPosts = JSON.parse(JSON.stringify(publicGroupPosts))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">OtakuZone</h1>
            <p className="mt-1 text-sm md:text-base text-slate-600 dark:text-slate-300">مجتمع للنقاشات والترشيحات والتقييمات الخاصة بالأنمي والمانجا</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/forum"
              className="bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-slate-800 transition"
            >
              افتح المنتدى
            </Link>
            <Link
              href="/forum/new"
              className="bg-anime-purple text-white px-5 py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
            >
              اكتب بوست
            </Link>
          </div>
        </div>
      </div>

      {/* Content Types */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">أنواع المحتوى</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contentTypes.map((type) => (
            <Link
              key={type.slug}
              href={`/forum?type=${type.slug}`}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-4xl mb-3">{type.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{type.name}</h3>
              <p className="text-gray-600">{type.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Categories */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">التصنيفات</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-4">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8">
          {safePublicGroupPosts.length > 0 ? (
            <div className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">من المجتمعات العامة</h2>
                <Link href="/groups" className="text-sm font-semibold text-anime-purple hover:text-anime-pink transition">
                  عرض كل المجتمعات
                </Link>
              </div>
              <div className="space-y-5">
                <GroupTopicList items={safePublicGroupPosts} className="space-y-5" />
              </div>
            </div>
          ) : null}

          <TopicFeed initialItems={safeInitialTopics} className="space-y-5" />
        </section>
        <aside className="lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            <AdBanner position="sidebar" className="" />
          </div>
        </aside>
      </div>
    </div>
  )
}

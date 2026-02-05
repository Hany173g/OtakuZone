import { withDB } from '@/lib/db'
import '@/models'
import Topic from '@/models/Topic'
import Comment from '@/models/Comment'
import TopicCard from '@/components/TopicCard'
import { Search } from 'lucide-react'
import { searchAnime } from '@/lib/anime-api'

interface SearchPageProps {
  searchParams: {
    q?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ''

  let topics: any[] = []
  let animeResults: any[] = []

  if (query) {
    // Search topics in MongoDB
    topics = await withDB(async () => {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const found = await Topic.find({
        $or: [{ title: regex }, { content: regex }],
      })
        .populate('authorId', 'name image')
        .populate('categoryId')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

      const withCounts = await Promise.all(
        found.map(async (t: any) => {
          const [commentCount] = await Promise.all([
            Comment.countDocuments({ topicId: t._id }),
          ])
          return {
            ...t,
            id: t._id.toString(),
            author: t.authorId,
            category: t.categoryId,
            _count: { comments: commentCount },
          }
        })
      )
      return withCounts
    })

    // Search anime via Jikan API
    animeResults = await searchAnime(query)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <Search className="w-10 h-10 text-anime-purple" />
          البحث
        </h1>
        <form method="get" className="max-w-2xl">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="ابحث عن مواضيع أو أنمي..."
              className="w-full pr-12 pl-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple text-lg"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-anime-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            بحث
          </button>
        </form>
      </div>

      {query && (
        <div>
          <p className="text-gray-600 mb-6">
            {topics.length > 0 || animeResults.length > 0
              ? `تم العثور على ${topics.length} موضوع و ${animeResults.length} أنمي`
              : 'لم يتم العثور على نتائج'}
          </p>

          {/* Anime search results */}
          {animeResults.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">أنميات مطابقة للبحث</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {animeResults.map((anime: any) => (
                  <div
                    key={anime.mal_id}
                    className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col"
                  >
                    {anime.images?.jpg?.image_url && (
                      <img
                        src={anime.images.jpg.image_url}
                        alt={anime.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h3 className="font-semibold text-gray-800 line-clamp-2">{anime.title}</h3>
                      {anime.title_english && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {anime.title_english}
                        </p>
                      )}
                      <div className="mt-auto flex flex-col gap-2 pt-2">
                        <a
                          href={`/anime/${anime.mal_id}`}
                          className="w-full text-center bg-anime-purple text-white py-2 rounded-lg text-sm hover:bg-purple-700 transition"
                        >
                          صفحة الأنمي والتقييم
                        </a>
                        <a
                          href={`/forum/new?anime=${encodeURIComponent(anime.title)}&malId=${anime.mal_id}`}
                          className="w-full text-center border border-anime-purple text-anime-purple py-2 rounded-lg text-sm hover:bg-anime-purple/5 transition"
                        >
                          اكتب موضوع عن هذا الأنمي
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topic results */}
          {topics.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">مواضيع المنتدى</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            </div>
          )}

          {topics.length === 0 && animeResults.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">لا توجد نتائج للبحث</p>
              <p className="text-gray-400 mt-2">جرب كلمات مفتاحية مختلفة</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


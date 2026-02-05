import type { Metadata } from 'next'
import AnimePageClient from '@/components/AnimePageClient'
import { getAnimeById } from '@/lib/anime-api'

interface AnimePageProps {
  params: { id: string }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function generateMetadata({ params }: AnimePageProps): Promise<Metadata> {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const animeId = parseInt(params.id)
  const anime = Number.isNaN(animeId) ? null : await getAnimeById(animeId)

  if (!anime) {
    return {
      title: 'الأنمي غير موجود | OtakuZone',
    }
  }

  const description = stripHtml(anime.synopsis || '').slice(0, 160)
  const url = `${siteUrl}/anime/${params.id}`
  const image = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url

  return {
    title: `${anime.title} | OtakuZone`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: anime.title,
      description,
      url,
      type: 'video.tv_show',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: anime.title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function AnimePage({ params }: AnimePageProps) {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const animeId = parseInt(params.id)
  const anime = Number.isNaN(animeId) ? null : await getAnimeById(animeId)
  const image = anime?.images?.jpg?.large_image_url || anime?.images?.jpg?.image_url
  const animeJsonLd = anime
    ? {
        '@context': 'https://schema.org',
        '@type': 'TVSeries',
        name: anime.title,
        description: stripHtml(anime.synopsis || '').slice(0, 160),
        image: image ? [image] : undefined,
        url: `${siteUrl}/anime/${params.id}`,
        numberOfEpisodes: anime.episodes,
        aggregateRating: anime.score
          ? {
              '@type': 'AggregateRating',
              ratingValue: anime.score,
              ratingCount: anime.scored_by,
            }
          : undefined,
      }
    : null

  return (
    <>
      {animeJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(animeJsonLd) }}
        />
      ) : null}
      <AnimePageClient />
    </>
  )
}


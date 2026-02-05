import type { MetadataRoute } from 'next'
import { withDB } from '@/lib/db'
import '@/models'
import Topic from '@/models/Topic'
import Group from '@/models/Group'
import Anime from '@/models/Anime'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: new Date() },
    { url: `${siteUrl}/forum`, lastModified: new Date() },
    { url: `${siteUrl}/categories`, lastModified: new Date() },
    { url: `${siteUrl}/groups`, lastModified: new Date() },
    { url: `${siteUrl}/top-users`, lastModified: new Date() },
  ]

  try {
    const { topicUrls, groupUrls, animeUrls } = await withDB(async () => {
      const [topics, groups, anime] = await Promise.all([
        Topic.find().select('slug updatedAt').limit(5000).lean(),
        Group.find({ isPublic: true }).select('slug updatedAt').limit(5000).lean(),
        Anime.find().select('malId updatedAt').limit(5000).lean(),
      ])

      return {
        topicUrls: topics.map((t: any) => ({
          url: `${siteUrl}/topic/${t.slug}`,
          lastModified: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        })),
        groupUrls: groups.map((g: any) => ({
          url: `${siteUrl}/groups/${g.slug}`,
          lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
        })),
        animeUrls: anime
          .filter((a: any) => a.malId)
          .map((a: any) => ({
            url: `${siteUrl}/anime/${a.malId}`,
            lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
          })),
      }
    })

    return [...staticUrls, ...topicUrls, ...groupUrls, ...animeUrls]
  } catch {
    return staticUrls
  }
}

import { NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import Ad from '@/models/Ad'

export async function GET() {
  try {
    const ads = await withDB(async () => {
      const allAds = await Ad.find()
        .sort({ createdAt: -1 })
        .lean()

      return allAds.map((ad: any) => ({
        _id: ad._id.toString(),
        title: ad.title,
        description: ad.description,
        image: ad.image,
        link: ad.link,
        position: ad.position,
        isActive: ad.isActive,
        impressions: ad.impressions,
        clicks: ad.clicks,
        createdAt: ad.createdAt,
        updatedAt: ad.updatedAt,
      }))
    })

    return NextResponse.json(ads)
  } catch (error) {
    console.error('Error fetching all ads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import Ad from '@/models/Ad'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position') || 'sidebar'
    const userId = searchParams.get('userId')

    // Check if user is premium (no ads for premium users)
    if (userId) {
      const user = await withDB(async () => {
        return await User.findById(userId).lean()
      })

      if (user?.isPremium && user.premiumUntil && new Date(user.premiumUntil) > new Date()) {
        return NextResponse.json([])
      }
    }

    // Fetch active ads from database
    const ads = await withDB(async () => {
      const foundAds = await Ad.find({
        position: position as 'top' | 'bottom' | 'sidebar',
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean()

      // Increment impressions
      if (foundAds.length > 0) {
        await Ad.updateOne(
          { _id: foundAds[0]._id },
          { $inc: { impressions: 1 } }
        )
      }

      return foundAds.map((ad: any) => ({
        _id: ad._id.toString(),
        title: ad.title,
        description: ad.description,
        image: ad.image,
        link: ad.link,
        position: ad.position,
        isActive: ad.isActive,
      }))
    })

    return NextResponse.json(ads)
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, image, link, position, isActive } = body

    const ad = await withDB(async () => {
      return await Ad.create({
        title,
        description,
        image,
        link,
        position,
        isActive: isActive !== undefined ? isActive : true,
      })
    })

    return NextResponse.json(
      { message: 'تم إنشاء الإعلان بنجاح', ad },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating ad:', error)
    return NextResponse.json(
      { error: 'Failed to create ad', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

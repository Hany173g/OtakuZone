import { NextRequest, NextResponse } from 'next/server'
import { searchAnime, getAnimeById, getTopAnime } from '@/lib/anime-api'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Anime from '@/models/Anime'
import { ERROR_MESSAGES } from '@/lib/validation-ar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const id = searchParams.get('id')
    const top = searchParams.get('top')

    if (id) {
      // Get anime by ID
      const anime = await getAnimeById(parseInt(id))
      if (!anime) {
        return NextResponse.json(
          { error: 'لم يتم العثور على الأنمي' },
          { status: 404 }
        )
      }
      return NextResponse.json(anime)
    }

    if (top) {
      // Get top anime
      const limit = parseInt(top) || 10
      const topAnime = await getTopAnime(limit)
      return NextResponse.json(topAnime)
    }

    if (query) {
      // Search anime
      const results = await searchAnime(query)
      return NextResponse.json(results)
    }

    return NextResponse.json(
      { error: 'يرجى توفير معامل q أو id أو top' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching anime:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { malId, title, titleEnglish, titleJapanese, image, synopsis, score, episodes, status, type, airedFrom, airedTo, genres, officialLinks } = body

    if (!title) {
      return NextResponse.json(
        { error: 'العنوان مطلوب' },
        { status: 400 }
      )
    }

    // Save or update anime in database
    const anime = await withDB(async () => {
      const animeData: any = {
        title,
        titleEnglish,
        titleJapanese,
        image,
        synopsis,
        score,
        episodes,
        status,
        type,
        airedFrom: airedFrom ? new Date(airedFrom) : undefined,
        airedTo: airedTo ? new Date(airedTo) : undefined,
        genres: genres ? JSON.stringify(genres) : undefined,
        officialLinks: officialLinks ? JSON.stringify(officialLinks) : undefined,
      }

      if (malId) {
        animeData.malId = malId
      }

      // Use findOneAndUpdate with upsert
      const existingAnime = malId 
        ? await Anime.findOne({ malId })
        : await Anime.findOne({ title })

      if (existingAnime) {
        Object.assign(existingAnime, animeData)
        await existingAnime.save()
        return existingAnime.toObject()
      } else {
        const newAnime = await Anime.create(animeData)
        return newAnime.toObject()
      }
    })

    return NextResponse.json(anime, { status: 201 })
  } catch (error: any) {
    console.error('Error saving anime:', error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'هذا الأنمي موجود بالفعل' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.CREATE_FAILED },
      { status: 500 }
    )
  }
}


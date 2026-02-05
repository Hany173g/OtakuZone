import { NextRequest, NextResponse } from 'next/server'
import { withDB } from '@/lib/db'
import '@/models' // This ensures all models are registered
import Rating from '@/models/Rating'
import User from '@/models/User'
import { z } from 'zod'
import mongoose from 'mongoose'
import { translateZodError, ERROR_MESSAGES } from '@/lib/validation-ar'

const ratingSchema = z.object({
  userId: z.string().min(1, 'معرف المستخدم مطلوب'),
  score: z.number().min(1, 'التقييم يجب أن يكون على الأقل 1').max(10, 'التقييم يجب أن يكون على الأكثر 10'),
  review: z.string().optional(),
  animeId: z.string().optional(),
  animeName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ratingSchema.parse(body)

    const rating = await withDB(async () => {
      const query: any = {
        userId: new mongoose.Types.ObjectId(validatedData.userId),
      }
      
      if (validatedData.animeId) {
        query.animeId = validatedData.animeId
      }

      const existingRating = await Rating.findOne(query)

      if (existingRating) {
        existingRating.score = validatedData.score
        if (validatedData.review !== undefined) {
          existingRating.review = validatedData.review
        }
        await existingRating.save()
        return await Rating.findById(existingRating._id)
          .populate('userId', 'name image')
          .lean()
      } else {
        const newRating = await Rating.create({
          userId: new mongoose.Types.ObjectId(validatedData.userId),
          score: validatedData.score,
          review: validatedData.review,
          animeId: validatedData.animeId,
          animeName: validatedData.animeName,
        })
        return await Rating.findById(newRating._id)
          .populate('userId', 'name image')
          .lean()
      }
    })

    if (!rating) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CREATE_FAILED },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...rating,
      id: rating._id.toString(),
      user: rating.userId,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: translateZodError(error) },
        { status: 400 }
      )
    }
    console.error('Error creating rating:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.CREATE_FAILED },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const animeId = searchParams.get('animeId')

    const result = await withDB(async () => {
      const query: any = {}
      if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId)
      }
      if (animeId) {
        query.animeId = animeId
      }

      const ratings = await Rating.find(query)
        .populate('userId', 'name image')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()

      // Calculate average rating if animeId is provided
      let averageRating = null
      if (animeId) {
        const ratingsForAnime = await Rating.find({ animeId })
        if (ratingsForAnime.length > 0) {
          const sum = ratingsForAnime.reduce((acc, r) => acc + r.score, 0)
          averageRating = {
            average: sum / ratingsForAnime.length,
            count: ratingsForAnime.length
          }
        }
      }

      return {
        ratings: ratings.map((r: any) => ({
          ...r,
          id: r._id.toString(),
          user: r.userId,
        })),
        averageRating
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.FETCH_FAILED },
      { status: 500 }
    )
  }
}


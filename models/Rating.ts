import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRating extends Document {
  score: number
  review?: string
  animeId?: string
  animeName?: string
  animeModelId?: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const RatingSchema = new Schema<IRating>(
  {
    score: { type: Number, required: true, min: 1, max: 10 },
    review: { type: String },
    animeId: { type: String },
    animeName: { type: String },
    animeModelId: { type: Schema.Types.ObjectId, ref: 'Anime' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
)

// Unique compound index
RatingSchema.index({ userId: 1, animeId: 1 }, { unique: true, sparse: true })
RatingSchema.index({ animeId: 1 })
RatingSchema.index({ animeModelId: 1 })

const Rating: Model<IRating> = mongoose.models.Rating || mongoose.model<IRating>('Rating', RatingSchema)

export default Rating


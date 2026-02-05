import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAnime extends Document {
  malId?: number
  title: string
  titleEnglish?: string
  titleJapanese?: string
  image?: string
  synopsis?: string
  score?: number
  episodes?: number
  status?: string
  type?: string
  airedFrom?: Date
  airedTo?: Date
  genres?: string
  officialLinks?: string
  createdAt: Date
  updatedAt: Date
}

const AnimeSchema = new Schema<IAnime>(
  {
    malId: { type: Number, unique: true, sparse: true },
    title: { type: String, required: true },
    titleEnglish: { type: String },
    titleJapanese: { type: String },
    image: { type: String },
    synopsis: { type: String },
    score: { type: Number },
    episodes: { type: Number },
    status: { type: String },
    type: { type: String },
    airedFrom: { type: Date },
    airedTo: { type: Date },
    genres: { type: String },
    officialLinks: { type: String },
  },
  {
    timestamps: true,
  }
)

// Indexes (malId already has unique index, so we don't duplicate it)
AnimeSchema.index({ title: 1 })

const Anime: Model<IAnime> = mongoose.models.Anime || mongoose.model<IAnime>('Anime', AnimeSchema)

export default Anime


import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITopic extends Document {
  title: string
  content: string
  slug: string
  type: 'anime' | 'manga' | 'manhwa' // النوع: أنمي، مانجا، مانهوا
  imageUrl?: string
  videoUrl?: string
  isPinned: boolean
  isLocked: boolean
  isPopular: boolean
  views: number
  authorId: mongoose.Types.ObjectId
  categoryId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const TopicSchema = new Schema<ITopic>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: ['anime', 'manga', 'manhwa'], required: true },
    imageUrl: { type: String },
    videoUrl: { type: String },
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for common queries
TopicSchema.index({ type: 1, categoryId: 1, createdAt: -1 })
TopicSchema.index({ categoryId: 1, createdAt: -1 })
TopicSchema.index({ isPopular: 1, views: -1 })
TopicSchema.index({ isPinned: 1, createdAt: -1 })
TopicSchema.index({ authorId: 1, createdAt: -1 })
TopicSchema.index({ title: 1 }) // for search
TopicSchema.index({ views: -1 }) // for sorting by views

// In Next.js dev (hot reload), mongoose keeps old compiled models in memory.
// If the schema changed (e.g. new fields like imageUrl or videoUrl), the cached model will
// ignore the new fields.
if (process.env.NODE_ENV !== 'production') {
  const existing = mongoose.models.Topic as any
  if (existing && existing.schema && (!existing.schema.path('imageUrl') || !existing.schema.path('videoUrl'))) {
    delete (mongoose.models as any).Topic
  }
}

const Topic: Model<ITopic> = mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema)

export default Topic


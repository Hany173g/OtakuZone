import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IGroupTopic extends Document {
  title: string
  content: string
  slug: string
  type: 'anime' | 'manga' | 'manhwa'
  groupId: mongoose.Types.ObjectId
  authorId: mongoose.Types.ObjectId
  categoryId: mongoose.Types.ObjectId
  imageUrl?: string
  videoUrl?: string
  isAnonymous: boolean
  anonymousName?: string
  status: 'pending' | 'published' | 'rejected'
  approvedBy?: mongoose.Types.ObjectId
  approvedAt?: Date
  isPinned: boolean
  isLocked: boolean
  views: number
  createdAt: Date
  updatedAt: Date
}

const GroupTopicSchema = new Schema<IGroupTopic>(
  {
    title: { type: String, required: true, index: true },
    content: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['anime', 'manga', 'manhwa'], required: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    imageUrl: { type: String },
    videoUrl: { type: String },
    isAnonymous: { type: Boolean, default: false, index: true },
    anonymousName: { type: String },
    status: { type: String, enum: ['pending', 'published', 'rejected'], default: 'published', index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    isPinned: { type: Boolean, default: false, index: true },
    isLocked: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

GroupTopicSchema.index({ groupId: 1, createdAt: -1 })
GroupTopicSchema.index({ groupId: 1, isPinned: 1, createdAt: -1 })
GroupTopicSchema.index({ groupId: 1, status: 1, createdAt: -1 })
GroupTopicSchema.index({ authorId: 1, createdAt: -1 })
GroupTopicSchema.index({ groupId: 1, type: 1, categoryId: 1, createdAt: -1 })

// In Next.js dev (hot reload), mongoose keeps old compiled models in memory.
// If the schema changed (e.g. new fields like categoryId), populate() will fail
// because the cached model still has the old schema.
if (process.env.NODE_ENV !== 'production') {
  const existing = mongoose.models.GroupTopic as any
  if (existing && existing.schema && !existing.schema.path('categoryId')) {
    delete (mongoose.models as any).GroupTopic
  }
}

const GroupTopic: Model<IGroupTopic> =
  mongoose.models.GroupTopic || mongoose.model<IGroupTopic>('GroupTopic', GroupTopicSchema)

export default GroupTopic


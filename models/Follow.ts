import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFollow extends Document {
  userId: mongoose.Types.ObjectId
  topicId: mongoose.Types.ObjectId
  createdAt: Date
}

const FollowSchema = new Schema<IFollow>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Unique compound index
FollowSchema.index({ userId: 1, topicId: 1 }, { unique: true })
FollowSchema.index({ userId: 1, createdAt: -1 })

const Follow: Model<IFollow> = mongoose.models.Follow || mongoose.model<IFollow>('Follow', FollowSchema)

export default Follow


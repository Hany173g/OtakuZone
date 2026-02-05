import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDislike extends Document {
  userId: mongoose.Types.ObjectId
  topicId?: mongoose.Types.ObjectId
  commentId?: mongoose.Types.ObjectId
  groupTopicId?: mongoose.Types.ObjectId
  groupCommentId?: mongoose.Types.ObjectId
  createdAt: Date
}

const DislikeSchema = new Schema<IDislike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    commentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
    groupTopicId: { type: Schema.Types.ObjectId, ref: 'GroupTopic' },
    groupCommentId: { type: Schema.Types.ObjectId, ref: 'GroupComment' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Unique compound index (one reaction per target per user)
DislikeSchema.index({ userId: 1, topicId: 1 }, { unique: true, sparse: true })
DislikeSchema.index({ userId: 1, commentId: 1 }, { unique: true, sparse: true })
DislikeSchema.index({ userId: 1, groupTopicId: 1 }, { unique: true, sparse: true })
DislikeSchema.index({ userId: 1, groupCommentId: 1 }, { unique: true, sparse: true })
DislikeSchema.index({ topicId: 1 })
DislikeSchema.index({ commentId: 1 })
DislikeSchema.index({ groupTopicId: 1 })
DislikeSchema.index({ groupCommentId: 1 })

const Dislike: Model<IDislike> =
  mongoose.models.Dislike || mongoose.model<IDislike>('Dislike', DislikeSchema)

export default Dislike


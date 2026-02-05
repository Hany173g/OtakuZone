import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILike extends Document {
  userId: mongoose.Types.ObjectId
  topicId?: mongoose.Types.ObjectId
  commentId?: mongoose.Types.ObjectId
  groupTopicId?: mongoose.Types.ObjectId
  groupCommentId?: mongoose.Types.ObjectId
  createdAt: Date
}

const LikeSchema = new Schema<ILike>(
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

// Unique compound index
LikeSchema.index({ userId: 1, topicId: 1 }, { unique: true, sparse: true })
LikeSchema.index({ userId: 1, commentId: 1 }, { unique: true, sparse: true })
LikeSchema.index({ userId: 1, groupTopicId: 1 }, { unique: true, sparse: true })
LikeSchema.index({ userId: 1, groupCommentId: 1 }, { unique: true, sparse: true })
LikeSchema.index({ topicId: 1 })
LikeSchema.index({ commentId: 1 })
LikeSchema.index({ groupTopicId: 1 })
LikeSchema.index({ groupCommentId: 1 })

const Like: Model<ILike> = mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema)

export default Like


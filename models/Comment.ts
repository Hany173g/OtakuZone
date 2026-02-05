import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IComment extends Document {
  content: string
  authorId: mongoose.Types.ObjectId
  topicId: mongoose.Types.ObjectId
  parentId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
CommentSchema.index({ topicId: 1, createdAt: 1 })
CommentSchema.index({ parentId: 1 })
CommentSchema.index({ authorId: 1, createdAt: -1 })

const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema)

export default Comment


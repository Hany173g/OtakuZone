import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IGroupComment extends Document {
  content: string
  groupTopicId: mongoose.Types.ObjectId
  authorId: mongoose.Types.ObjectId
  parentId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const GroupCommentSchema = new Schema<IGroupComment>(
  {
    content: { type: String, required: true },
    groupTopicId: { type: Schema.Types.ObjectId, ref: 'GroupTopic', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'GroupComment' },
  },
  {
    timestamps: true,
  }
)

GroupCommentSchema.index({ groupTopicId: 1, createdAt: 1 })
GroupCommentSchema.index({ parentId: 1 })
GroupCommentSchema.index({ authorId: 1, createdAt: -1 })

const GroupComment: Model<IGroupComment> =
  mongoose.models.GroupComment || mongoose.model<IGroupComment>('GroupComment', GroupCommentSchema)

export default GroupComment


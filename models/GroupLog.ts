import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IGroupLog extends Document {
  groupId: mongoose.Types.ObjectId
  actorId: mongoose.Types.ObjectId
  action: string
  targetUserId?: mongoose.Types.ObjectId
  targetTopicId?: mongoose.Types.ObjectId
  meta?: any
  createdAt: Date
}

const GroupLogSchema = new Schema<IGroupLog>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetTopicId: { type: Schema.Types.ObjectId, ref: 'GroupTopic' },
    meta: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

GroupLogSchema.index({ groupId: 1, createdAt: -1 })
GroupLogSchema.index({ actorId: 1, createdAt: -1 })

const GroupLog: Model<IGroupLog> = mongoose.models.GroupLog || mongoose.model<IGroupLog>('GroupLog', GroupLogSchema)

export default GroupLog

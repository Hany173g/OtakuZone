import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INotification extends Document {
  type: string
  message: string
  read: boolean
  link?: string
  userId: mongoose.Types.ObjectId
  relatedUserId?: mongoose.Types.ObjectId
  relatedTopicId?: mongoose.Types.ObjectId
  relatedCommentId?: mongoose.Types.ObjectId
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    type: { type: String, required: true, index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    link: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relatedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    relatedTopicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    relatedCommentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Compound indexes for common queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)

export default Notification


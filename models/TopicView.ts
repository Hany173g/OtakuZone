import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITopicView extends Document {
  topicId: mongoose.Types.ObjectId
  ipHash: string
  day: string // YYYY-MM-DD
  createdAt: Date
}

const TopicViewSchema = new Schema<ITopicView>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    ipHash: { type: String, required: true },
    day: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Count at most one view per IP per day per topic
TopicViewSchema.index({ topicId: 1, ipHash: 1, day: 1 }, { unique: true })
TopicViewSchema.index({ day: 1 })

const TopicView: Model<ITopicView> =
  mongoose.models.TopicView || mongoose.model<ITopicView>('TopicView', TopicViewSchema)

export default TopicView


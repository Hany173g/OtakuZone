import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[]
  participantsKey: string
  createdAt: Date
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    participantsKey: { type: String, required: true, unique: true, index: true },
  },
  {
    timestamps: true,
  }
)

ConversationSchema.index({ participantsKey: 1 }, { unique: true })

const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema)

export default Conversation

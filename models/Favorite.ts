import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId
  topicId: mongoose.Types.ObjectId
  createdAt: Date
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Unique compound index - لا يمكن إضافة نفس الموضوع للمفضلة مرتين
FavoriteSchema.index({ userId: 1, topicId: 1 }, { unique: true })
FavoriteSchema.index({ userId: 1, createdAt: -1 })

const Favorite: Model<IFavorite> =
  mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema)

export default Favorite


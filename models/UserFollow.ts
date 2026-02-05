import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUserFollow extends Document {
  followerId: mongoose.Types.ObjectId // المستخدم الذي يتابع
  followingId: mongoose.Types.ObjectId // المستخدم المتابوع
  notify: boolean
  createdAt: Date
}

const UserFollowSchema = new Schema<IUserFollow>(
  {
    followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notify: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Unique compound index - لا يمكن متابعة نفس الشخص مرتين
UserFollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true })
UserFollowSchema.index({ followerId: 1, createdAt: -1 })
UserFollowSchema.index({ followingId: 1, createdAt: -1 })

const UserFollow: Model<IUserFollow> =
  mongoose.models.UserFollow || mongoose.model<IUserFollow>('UserFollow', UserFollowSchema)

export default UserFollow


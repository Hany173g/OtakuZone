import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IGroupMember extends Document {
  groupId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  role: 'admin' | 'moderator' | 'member' // دور العضو في الجروب
  status: 'active' | 'pending' | 'banned' // حالة العضوية
  joinedAt: Date
  createdAt: Date
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'banned'],
      default: 'active',
      index: true,
    },
    joinedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Unique compound index - لا يمكن أن يكون المستخدم عضو مرتين في نفس الجروب
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true })
GroupMemberSchema.index({ userId: 1, status: 1, createdAt: -1 })
GroupMemberSchema.index({ groupId: 1, role: 1 })
GroupMemberSchema.index({ groupId: 1, status: 1 })

const GroupMember: Model<IGroupMember> =
  mongoose.models.GroupMember || mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema)

export default GroupMember


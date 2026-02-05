import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IGroup extends Document {
  name: string
  slug: string
  description?: string
  image: string
  coverImage: string
  isPublic: boolean // عام أو خاص
  isApprovalRequired: boolean // يحتاج موافقة للانضمام
  settings: {
    postApprovalRequired: boolean
    allowAnonymousPosts: boolean
  }
  rules: {
    title: string
    description?: string
    createdAt: Date
    createdBy: mongoose.Types.ObjectId
  }[]
  creatorId: mongoose.Types.ObjectId
  category?: string
  tags?: string[]
  memberCount: number
  topicCount: number
  createdAt: Date
  updatedAt: Date
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    image: { type: String, required: true },
    coverImage: { type: String, required: true },
    isPublic: { type: Boolean, default: true, index: true },
    isApprovalRequired: { type: Boolean, default: false },
    settings: {
      postApprovalRequired: { type: Boolean, default: false },
      allowAnonymousPosts: { type: Boolean, default: false },
    },
    rules: [
      {
        title: { type: String, required: true },
        description: { type: String },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String },
    tags: [{ type: String }],
    memberCount: { type: Number, default: 0, index: true },
    topicCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

GroupSchema.index({ creatorId: 1, createdAt: -1 })
GroupSchema.index({ isPublic: 1, memberCount: -1 })

const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema)

export default Group


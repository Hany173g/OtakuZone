import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name?: string
  email: string
  emailVerified?: Date
  image?: string
  socialLinks?: {
    discord?: string
    youtube?: string
    facebook?: string
    tiktok?: string
    telegram?: string
    instagram?: string
  }
  password?: string
  role: 'user' | 'moderator' | 'admin'
  isPremium: boolean
  premiumUntil?: Date
  // Privacy settings
  profileVisibility: 'public' | 'private' | 'friends' // خصوصية الملف الشخصي
  showEmail: boolean // إظهار البريد الإلكتروني
  showActivity: boolean // إظهار النشاط
  allowMessages: boolean // السماح بالرسائل
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date },
    image: { type: String },
    socialLinks: {
      discord: { type: String },
      youtube: { type: String },
      facebook: { type: String },
      tiktok: { type: String },
      telegram: { type: String },
      instagram: { type: String },
    },
    password: { type: String },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date },
    // Privacy settings
    profileVisibility: { type: String, enum: ['public', 'private', 'friends'], default: 'public' },
    showEmail: { type: Boolean, default: false },
    showActivity: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance (email already has unique index, so we don't need to add it again)
UserSchema.index({ role: 1 })
UserSchema.index({ isPremium: 1 })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User


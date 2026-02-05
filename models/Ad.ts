import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAd extends Document {
  title: string
  description: string
  image?: string
  link: string
  position: 'top' | 'bottom' | 'sidebar'
  isActive: boolean
  impressions: number
  clicks: number
  createdAt: Date
  updatedAt: Date
}

const AdSchema = new Schema<IAd>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    link: { type: String, required: true },
    position: { type: String, enum: ['top', 'bottom', 'sidebar'], required: true },
    isActive: { type: Boolean, default: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
AdSchema.index({ position: 1, isActive: 1 })

const Ad: Model<IAd> = mongoose.models.Ad || mongoose.model<IAd>('Ad', AdSchema)

export default Ad


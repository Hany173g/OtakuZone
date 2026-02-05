import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICategory extends Document {
  name: string
  nameEn?: string
  slug: string
  description?: string
  icon?: string
  color?: string
  createdAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    nameEn: { type: String },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    icon: { type: String },
    color: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// slug already has unique index, so we don't need to add it again

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)

export default Category


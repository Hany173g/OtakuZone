// Load .env file first
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') })

import connectDB from '../lib/mongodb'
import User from '../models/User'
import Category from '../models/Category'
import Topic from '../models/Topic'
const bcrypt = require('bcryptjs')

async function main() {
  console.log('🌱 Starting seed with Mongoose...')

  try {
    await connectDB()
    console.log('✅ Connected to MongoDB')

    // Create categories - نظريات أولاً
    const categories = [
      { name: 'نظريات', nameEn: 'Theories', slug: 'theories', description: 'نظريات وتحليلات', color: '#8b5cf6' },
      { name: 'شونين', nameEn: 'Shounen', slug: 'shounen', description: 'أنمي موجه للشباب', color: '#ef4444' },
      { name: 'شوجو', nameEn: 'Shoujo', slug: 'shoujo', description: 'أنمي موجه للفتيات', color: '#ec4899' },
      { name: 'إيسيكاي', nameEn: 'Isekai', slug: 'isekai', description: 'أنمي انتقال إلى عالم آخر', color: '#a855f7' },
      { name: 'ساينس فيكشن', nameEn: 'Sci-Fi', slug: 'sci-fi', description: 'خيال علمي', color: '#3b82f6' },
      { name: 'كوميديا', nameEn: 'Comedy', slug: 'comedy', description: 'أنمي كوميدي', color: '#eab308' },
      { name: 'رومانس', nameEn: 'Romance', slug: 'romance', description: 'أنمي رومانسي', color: '#f43f5e' },
      { name: 'أكشن', nameEn: 'Action', slug: 'action', description: 'أنمي أكشن', color: '#f97316' },
      { name: 'دراما', nameEn: 'Drama', slug: 'drama', description: 'أنمي درامي', color: '#6366f1' },
    ]

    for (const category of categories) {
      await Category.findOneAndUpdate(
        { slug: category.slug },
        category,
        { upsert: true, new: true }
      )
    }

    console.log('✅ Categories created')

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await User.findOneAndUpdate(
      { email: 'admin@otakuzone.com' },
      {
        email: 'admin@otakuzone.com',
        name: 'مدير الموقع',
        password: hashedPassword,
        role: 'admin',
      },
      { upsert: true, new: true }
    )

    console.log('✅ Admin user created')

    // لا ننشئ مستخدمين تجريبيين أو مواضيع وهمية
    // سيتم إنشاء جميع المستخدمين والمواضيع من خلال واجهة الموقع فقط
    console.log('🎉 Seed completed! (categories + admin only)')
  } catch (error) {
    console.error('❌ Seed error:', error)
    throw error
  }
}

main()
  .then(() => {
    console.log('✅ Seed script finished')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Seed script failed:', e)
    process.exit(1)
  })


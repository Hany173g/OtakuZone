# دليل الانتقال إلى MongoDB

تم تحديث المشروع لاستخدام **MongoDB مع Mongoose** بدلاً من SQLite/Prisma لدعم عدد كبير من المستخدمين (10,000+ مستخدم متزامن).

## ✅ ما تم إنجازه:

### 1. تحديث Prisma Schema
- تم تغيير `provider` من `sqlite` إلى `mongodb`
- تم تحديث `User` model لاستخدام `@db.ObjectId`

### 2. إضافة Mongoose
- تم إضافة `mongoose` و `@types/mongoose` إلى `package.json`
- تم إنشاء `lib/mongodb.ts` للاتصال بقاعدة البيانات

### 3. إنشاء نماذج Mongoose
تم إنشاء جميع النماذج في مجلد `models/`:
- ✅ `User.ts` - المستخدمون
- ✅ `Category.ts` - التصنيفات
- ✅ `Topic.ts` - المواضيع
- ✅ `Comment.ts` - التعليقات
- ✅ `Like.ts` - الإعجابات
- ✅ `Follow.ts` - المتابعات
- ✅ `Notification.ts` - الإشعارات
- ✅ `Rating.ts` - التقييمات
- ✅ `Anime.ts` - معلومات الأنمي

### 4. Indexes للأداء
تم إضافة indexes محسّنة في جميع النماذج لتحسين الأداء:
- Compound indexes للاستعلامات الشائعة
- Unique indexes للحقول الفريدة
- Indexes للبحث والترتيب

## 📋 الخطوات التالية:

### 1. تثبيت المتطلبات الجديدة

```bash
npm install
```

### 2. تحديث ملف `.env`

تأكد من أن `DATABASE_URL` يحتوي على رابط MongoDB الخاص بك:

```env
DATABASE_URL="mongodb+srv://OtakuZoe:H94eHbFtslZqrduF@otakuzone.y81ckws.mongodb.net/?appName=OtakuZone"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
JIKAN_API_URL="https://api.jikan.moe/v4"
```

### 3. تحديث Prisma Client

```bash
npm run db:generate
```

### 4. تحديث API Routes

**ملاحظة مهمة**: تحتاج إلى تحديث جميع API routes لاستخدام Mongoose بدلاً من Prisma.

تم تحديث:
- ✅ `app/api/topics/route.ts` (مثال)

يحتاج تحديث:
- ⏳ `app/api/comments/route.ts`
- ⏳ `app/api/likes/route.ts`
- ⏳ `app/api/follows/route.ts`
- ⏳ `app/api/notifications/route.ts`
- ⏳ `app/api/ratings/route.ts`
- ⏳ `app/api/anime/route.ts`
- ⏳ `app/api/auth/login/route.ts`
- ⏳ `app/api/auth/register/route.ts`

### 5. تحديث Server Components

يحتاج تحديث جميع Server Components التي تستخدم Prisma:
- `app/page.tsx`
- `app/forum/page.tsx`
- `app/topic/[slug]/page.tsx`
- `app/profile/[id]/page.tsx`
- `app/admin/page.tsx`
- وغيرها...

## 🔄 مثال على التحويل من Prisma إلى Mongoose:

### قبل (Prisma):
```typescript
const topics = await prisma.topic.findMany({
  where: { categoryId },
  include: { author: true, category: true }
})
```

### بعد (Mongoose):
```typescript
import { withDB } from '@/lib/db'
import Topic from '@/models/Topic'

const topics = await withDB(async () => {
  return await Topic.find({ categoryId })
    .populate('authorId', 'name image')
    .populate('categoryId')
    .lean()
})
```

## 📊 مميزات MongoDB للأداء:

1. **Scalability**: MongoDB يدعم التوسع الأفقي بسهولة
2. **Indexes**: فهارس محسّنة للاستعلامات السريعة
3. **Connection Pooling**: Mongoose يدير pool الاتصالات تلقائياً
4. **Sharding**: يمكن تقسيم البيانات عبر عدة servers
5. **Replication**: نسخ احتياطية تلقائية

## ⚡ تحسينات الأداء المضافة:

- Compound indexes للاستعلامات المركبة
- Indexes على الحقول المستخدمة في البحث والترتيب
- Connection caching في development
- Lean queries لتقليل استهلاك الذاكرة

## 🚀 الخطوات التالية الموصى بها:

1. **تحديث جميع API routes** (استخدم `app/api/topics/route.ts` كمرجع)
2. **تحديث Server Components** (استخدم `withDB` helper)
3. **اختبار الأداء** مع بيانات حقيقية
4. **إضافة Monitoring** لمراقبة الأداء
5. **إعداد Replica Set** للإنتاج

## 📝 ملاحظات:

- جميع النماذج تستخدم `mongoose.Types.ObjectId` للمراجع
- استخدم `.populate()` لتحميل البيانات المرتبطة
- استخدم `.lean()` للاستعلامات السريعة (بدون methods)
- استخدم `withDB()` helper لضمان الاتصال قبل العمليات


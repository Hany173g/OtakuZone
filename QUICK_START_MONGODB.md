# دليل البدء السريع - MongoDB

## ✅ تم التحديث بنجاح!

المشروع الآن يستخدم **MongoDB مع Mongoose** بدلاً من SQLite/Prisma.

## 🚀 خطوات البدء:

### 1. تثبيت المتطلبات

```bash
npm install
```

### 2. تحديث ملف `.env`

تأكد من أن `DATABASE_URL` يحتوي على رابط MongoDB:

```env
DATABASE_URL="mongodb+srv://OtakuZoe:H94eHbFtslZqrduF@otakuzone.y81ckws.mongodb.net/?appName=OtakuZone"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
JIKAN_API_URL="https://api.jikan.moe/v4"
```

### 3. تحديث Prisma Client (اختياري)

```bash
npm run db:generate
```

### 4. ملء البيانات الأولية

```bash
npm run db:seed
```

سيتم إنشاء:
- 8 تصنيفات
- مستخدم إداري (admin@otakuzone.com / admin123)
- مستخدم تجريبي (user@test.com / user123)
- مواضيع تجريبية

### 5. تشغيل المشروع

```bash
npm run dev
```

## 📝 ملاحظات مهمة:

### ✅ ما تم إنجازه:

1. **تم تحديث Prisma Schema** لاستخدام MongoDB
2. **تم إنشاء جميع نماذج Mongoose** في `models/`
3. **تم إضافة Indexes محسّنة** للأداء
4. **تم تحديث `app/api/topics/route.ts`** كمثال
5. **تم إنشاء seed script جديد** (`seed-mongoose.ts`)

### ⚠️ ما يحتاج تحديث:

تحتاج إلى تحديث باقي API routes و Server Components لاستخدام Mongoose. راجع `MONGODB_MIGRATION.md` للتفاصيل.

## 🔧 الملفات المهمة:

- `lib/mongodb.ts` - اتصال MongoDB
- `lib/db.ts` - Helper للاتصال
- `models/` - جميع نماذج Mongoose
- `prisma/seed-mongoose.ts` - Seed script جديد

## 📊 مميزات MongoDB:

- ✅ يدعم 10,000+ مستخدم متزامن
- ✅ Scalability أفقية
- ✅ Indexes محسّنة
- ✅ Connection pooling تلقائي
- ✅ Replication و Sharding

## 🆘 في حالة المشاكل:

1. تأكد من أن `DATABASE_URL` صحيح
2. تأكد من أن MongoDB Atlas يسمح بالاتصالات من IP الخاص بك
3. راجع `MONGODB_MIGRATION.md` للتفاصيل الكاملة


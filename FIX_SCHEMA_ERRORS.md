# إصلاح مشاكل Schema Registration في Mongoose

## ❌ المشكلة:
```
Error: Schema hasn't been registered for model "User".
Use mongoose.model(name, schema)
```

## 🔍 السبب:
في Next.js Server Components، عند استخدام `populate()` في Mongoose، يجب أن تكون جميع Models مسجلة قبل استخدامها. المشكلة تحدث عندما:
1. تستخدم `Topic.find().populate('authorId')` قبل استيراد User model
2. Models لم يتم تسجيلها بشكل صحيح

---

## ✅ الحل:

### 1. إنشاء `models/index.ts`
تم إنشاء ملف `models/index.ts` الذي يستورد جميع Models ويضمن تسجيلها.

### 2. استيراد `@/models` في جميع الملفات
في أي ملف يستخدم `populate()`، يجب استيراد:
```typescript
import '@/models' // This ensures all models are registered
```

### 3. الملفات المحدثة:
- ✅ `app/page.tsx`
- ✅ `app/forum/page.tsx`
- ✅ `app/topic/[slug]/page.tsx`
- ✅ `app/profile/[id]/page.tsx`
- ✅ `app/api/topics/route.ts`
- ✅ `app/api/comments/route.ts`

---

## 📝 مثال:

### قبل (خطأ):
```typescript
import Topic from '@/models/Topic'

const topics = await Topic.find()
  .populate('authorId') // ❌ Error: Schema hasn't been registered
```

### بعد (صحيح):
```typescript
import '@/models' // ✅ Register all models first
import Topic from '@/models/Topic'

const topics = await Topic.find()
  .populate('authorId') // ✅ Works!
```

---

## 🔧 إذا استمرت المشكلة:

### 1. تأكد من استيراد models/index.ts
```typescript
import '@/models'
```

### 2. تأكد من أن جميع Models موجودة في models/index.ts
```typescript
// models/index.ts
import User from './User'
import Category from './Category'
// ... etc
```

### 3. إعادة تشغيل Dev Server
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
npm run dev
```

---

## ✅ بعد الإصلاح:

1. جميع Models مسجلة قبل استخدام populate
2. لا توجد أخطاء Schema
3. الموقع يعمل بشكل صحيح


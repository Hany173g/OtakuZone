# إصلاح الأخطاء

## المشاكل التي تم إصلاحها:

### 1. ✅ خطأ Prisma Schema - العلاقة بين Anime و Rating
- تم إضافة حقل `animeModel` في `Rating` للعلاقة العكسية
- تم إضافة `@relation("AnimeRatings")` في `Anime`

### 2. ✅ خطأ Font - subset 'arabic' غير متاح
- تم تغيير من `['latin', 'arabic']` إلى `['latin', 'latin-ext']` في `app/layout.tsx`
- الخط سيعمل بشكل جيد مع النصوص العربية

### 3. ✅ خطأ Seed Script - JSON parsing
- تم إنشاء `tsconfig.seed.json` منفصل
- تم تحديث `package.json` لاستخدام `--project` بدلاً من `--compiler-options`

### 4. ⚠️ خطأ DATABASE_URL
- يجب أن يبدأ بـ `file:`
- تأكد من وجود ملف `.env` مع المحتوى التالي:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
JIKAN_API_URL="https://api.jikan.moe/v4"
```

## الخطوات التالية:

1. **إنشاء ملف `.env`**:
```bash
# انسخ .env.example إلى .env
copy .env.example .env
# أو أنشئه يدوياً بالمحتوى أعلاه
```

2. **تحديث قاعدة البيانات**:
```bash
npm run db:generate
npm run db:push
```

3. **ملء البيانات الأولية**:
```bash
npm run db:seed
```

4. **تشغيل المشروع**:
```bash
npm run dev
```

## ملاحظات:

- تأكد من أن `DATABASE_URL` يبدأ بـ `file:` في ملف `.env`
- إذا استمرت المشاكل، احذف مجلد `.next` وجرب مرة أخرى:
```bash
rm -rf .next
npm run dev
```


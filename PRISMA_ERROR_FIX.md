# حل مشكلة Prisma Error (EPERM)

## ❌ الخطأ:
```
EPERM: operation not permitted, rename 'C:\Users\7ouda\OneDrive\Desktop\OtakuZone\node_modules\.prisma\client\query_engine-windows.dll.node.tmp9552' 
-> 'C:\Users\7ouda\OneDrive\Desktop\OtakuZone\node_modules\.prisma\client\query_engine-windows.dll.node'
```

## 🔍 السبب:
هذا الخطأ يحدث عندما:
1. **Prisma Client قيد الاستخدام** - عملية أخرى تستخدم الملف
2. **VS Code أو محرر آخر** يفتح الملف
3. **Next.js dev server** يعمل ويستخدم Prisma Client
4. **مشكلة في الصلاحيات** - Windows يمنع الوصول للملف

---

## ✅ الحلول:

### الحل 1: إغلاق Next.js Dev Server
```bash
# اضغط Ctrl+C في Terminal لإيقاف dev server
# ثم حاول مرة أخرى:
npm run db:generate
```

### الحل 2: إغلاق VS Code وإعادة فتحه
1. أغلق VS Code بالكامل
2. افتح Task Manager (Ctrl+Shift+Esc)
3. تأكد من عدم وجود عمليات `node.exe` قيد التشغيل
4. افتح VS Code مرة أخرى
5. جرب `npm run db:generate`

### الحل 3: حذف node_modules وإعادة التثبيت
```bash
# احذف node_modules
rmdir /s /q node_modules

# احذف package-lock.json
del package-lock.json

# أعد التثبيت
npm install

# ثم جرب
npm run db:generate
```

### الحل 4: تشغيل PowerShell كـ Administrator
1. اضغط `Win + X`
2. اختر "Windows PowerShell (Admin)"
3. انتقل إلى مجلد المشروع:
   ```powershell
   cd "C:\Users\7ouda\OneDrive\Desktop\OtakuZone"
   ```
4. جرب:
   ```powershell
   npm run db:generate
   ```

### الحل 5: حذف .prisma folder يدوياً
```bash
# احذف مجلد .prisma
rmdir /s /q node_modules\.prisma

# ثم جرب
npm run db:generate
```

---

## ⚠️ ملاحظة مهمة:

**لا تحتاج Prisma Client في هذا المشروع!**

المشروع يستخدم **Mongoose** وليس Prisma Client. لذلك:
- ✅ **لا تحتاج** لتشغيل `npm run db:generate`
- ✅ المشروع **يعمل بدون Prisma Client**
- ✅ استخدم **Mongoose models** فقط

---

## 🎯 الحل الأفضل:

**تجاهل الخطأ!** لأن:
1. المشروع يستخدم **Mongoose** وليس Prisma Client
2. جميع API routes تستخدم **Mongoose models**
3. Seed script يستخدم **Mongoose**
4. لا حاجة لـ Prisma Client في هذا المشروع

---

## 📝 إذا أردت إزالة Prisma تماماً:

يمكنك حذف:
- `prisma/schema.prisma` (اختياري - يمكن الاحتفاظ به للتوثيق)
- `@prisma/client` من `package.json` (اختياري)

لكن **لا حاجة لذلك** - يمكنك ببساطة تجاهل الخطأ.


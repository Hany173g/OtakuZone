# حل مشاكل Next.js - ERR_ABORTED 404

## ❌ المشكلة:
```
GET http://localhost:3000/_next/static/chunks/app-pages-internals.js net::ERR_ABORTED 404
GET http://localhost:3000/_next/static/chunks/app/login/page.js 404
GET http://localhost:3000/_next/static/chunks/main-app.js net::ERR_ABORTED 404
GET http://localhost:3000/_next/static/chunks/app/not-found.js net::ERR_ABORTED 404
```

## 🔍 السبب:
هذه المشكلة تحدث عادة عندما:
1. **مجلد `.next` تالف** - يحتاج إعادة بناء
2. **Dev server لم يتم إعادة تشغيله** بشكل صحيح
3. **Cache قديم** - يحتاج تنظيف
4. **Port 3000 مستخدم** - من عملية سابقة

---

## ✅ الحلول:

### الحل 1: تنظيف وإعادة التشغيل (الأفضل)

```powershell
# 1. إيقاف جميع عمليات Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. حذف مجلد .next
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 3. حذف node_modules/.cache إن وجد
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# 4. إعادة تشغيل dev server
npm run dev
```

### الحل 2: استخدام port مختلف

إذا كان port 3000 مستخدم:

```powershell
# استخدم port 3001
npm run dev -- -p 3001
```

أو في `package.json`:
```json
"dev": "next dev -p 3001"
```

### الحل 3: إعادة تثبيت node_modules

```powershell
# حذف node_modules
Remove-Item -Recurse -Force node_modules

# حذف package-lock.json
Remove-Item package-lock.json

# إعادة التثبيت
npm install

# إعادة تشغيل
npm run dev
```

### الحل 4: التحقق من Next.js version

```powershell
# تحديث Next.js
npm install next@latest

# إعادة تشغيل
npm run dev
```

---

## 🔧 خطوات مفصلة:

### الخطوة 1: إيقاف جميع العمليات
```powershell
# في PowerShell
Get-Process -Name node | Stop-Process -Force
```

أو في Task Manager:
- اضغط `Ctrl + Shift + Esc`
- ابحث عن `node.exe`
- اضغط `End Task` لكل عملية

### الخطوة 2: حذف مجلد .next
```powershell
Remove-Item -Recurse -Force .next
```

### الخطوة 3: تنظيف Cache
```powershell
# حذف cache
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

### الخطوة 4: إعادة تشغيل Dev Server
```powershell
npm run dev
```

---

## ⚠️ ملاحظات مهمة:

1. **تأكد من إغلاق المتصفح** قبل إعادة التشغيل
2. **افتح المتصفح في نافذة جديدة** بعد إعادة التشغيل
3. **استخدم Hard Refresh**: `Ctrl + Shift + R` أو `Ctrl + F5`
4. **تحقق من Console** في المتصفح للأخطاء

---

## 🐛 إذا استمرت المشكلة:

### 1. تحقق من Port
```powershell
# تحقق من العمليات على port 3000
netstat -ano | findstr :3000
```

### 2. استخدم Port مختلف
```powershell
npm run dev -- -p 3001
```

### 3. تحقق من Next.js Config
تأكد من أن `next.config.js` صحيح:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعداداتك هنا
}

module.exports = nextConfig
```

### 4. تحقق من TypeScript Config
تأكد من أن `tsconfig.json` صحيح:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 📝 خطوات سريعة (Copy & Paste):

```powershell
# تنظيف كامل وإعادة تشغيل
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
npm run dev
```

---

## ✅ بعد الحل:

1. افتح المتصفح
2. اذهب إلى `http://localhost:3000`
3. اضغط `Ctrl + Shift + R` لـ Hard Refresh
4. تحقق من Console للأخطاء

---

## 🆘 إذا لم يعمل:

1. **أعد تشغيل الكمبيوتر**
2. **تأكد من أن Node.js محدث**: `node --version` (يجب أن يكون 18+)
3. **تأكد من أن npm محدث**: `npm --version`
4. **جرب حذف node_modules وإعادة التثبيت**


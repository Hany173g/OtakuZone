# إعداد MongoDB Atlas - حل مشكلة IP Whitelist

## المشكلة
إذا ظهرت رسالة الخطأ التالية:
```
Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## الحل

### الخطوة 1: إضافة IP إلى قائمة المسموح بها

1. سجل الدخول إلى [MongoDB Atlas](https://cloud.mongodb.com/)
2. اختر مشروعك (Cluster)
3. اضغط على **Network Access** من القائمة الجانبية
4. اضغط على **Add IP Address**
5. اختر أحد الخيارات:
   - **Add Current IP Address** - لإضافة IP الحالي فقط
   - **Allow Access from Anywhere** - للسماح من أي IP (0.0.0.0/0) - **غير آمن للإنتاج**
6. اضغط **Confirm**

### الخطوة 2: التحقق من الاتصال

بعد إضافة IP، انتظر دقيقة ثم جرب الاتصال مرة أخرى.

### للبيئة الإنتاجية (Production)

**⚠️ مهم جداً:** لا تستخدم `0.0.0.0/0` في الإنتاج!

1. احصل على IP الخاص بخادمك (VPS/Server)
2. أضف IP الخادم فقط إلى قائمة المسموح بها
3. إذا كان لديك IP ديناميكي، استخدم MongoDB Atlas IP Access List API

### للبيئة المحلية (Development)

يمكنك استخدام `0.0.0.0/0` مؤقتاً للاختبار، لكن احذف هذا الإعداد قبل الرفع للإنتاج.

## التحقق من الاتصال

بعد إضافة IP، جرب تشغيل:

```bash
npm run dev
```

يجب أن ترى رسالة:
```
✅ تم الاتصال بقاعدة البيانات MongoDB: otakuzone
```

## ملاحظات إضافية

- قد يستغرق تحديث IP Access List دقيقة أو دقيقتين
- تأكد من أن `DATABASE_URL` في ملف `.env` صحيح
- تأكد من أن اسم قاعدة البيانات في `lib/mongodb.ts` هو `otakuzone`


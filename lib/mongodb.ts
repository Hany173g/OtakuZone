import mongoose from 'mongoose'

function getMongoUri() {
  const uri = process.env.DATABASE_URL
  if (!uri) {
    throw new Error('يرجى تعريف متغير DATABASE_URL في ملف .env')
  }
  return uri
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Use global variable to cache the connection in development
declare global {
  var mongoose: MongooseCache | undefined
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const MONGODB_URI = getMongoUri()
    const opts = {
      bufferCommands: false,
      dbName: 'otakuzone', // اسم قاعدة البيانات المخصصة لمشروع OtakuZone
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ تم الاتصال بقاعدة البيانات MongoDB: otakuzone')
      return mongoose
    }).catch((error: any) => {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message)
      cached.promise = null
      
      // Provide Arabic error message based on error type
      const errorMsg = error.message || ''
      
      if (errorMsg.includes('IP') || errorMsg.includes('whitelist') || errorMsg.includes('not whitelisted')) {
        const arabicError = new Error('فشل الاتصال بقاعدة البيانات. يرجى التأكد من إضافة عنوان IP الخاص بك إلى قائمة المسموح بها في MongoDB Atlas.\n\nخطوات الحل:\n1. اذهب إلى https://cloud.mongodb.com/\n2. اختر مشروعك → Network Access\n3. اضغط Add IP Address\n4. اختر Add Current IP Address\n5. انتظر دقيقة ثم جرب مرة أخرى')
        arabicError.name = 'MongoDBConnectionError'
        throw arabicError
      }
      
      if (errorMsg.includes('authentication') || errorMsg.includes('auth') || errorMsg.includes('password')) {
        const arabicError = new Error('فشل المصادقة مع قاعدة البيانات. يرجى التحقق من:\n1. صحة DATABASE_URL في ملف .env\n2. صحة اسم المستخدم وكلمة المرور\n3. أن المستخدم لديه صلاحيات الوصول')
        arabicError.name = 'MongoDBAuthError'
        throw arabicError
      }
      
      if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
        const arabicError = new Error('فشل العثور على خادم قاعدة البيانات. يرجى التحقق من:\n1. اتصال الإنترنت\n2. صحة DATABASE_URL في ملف .env')
        arabicError.name = 'MongoDBNetworkError'
        throw arabicError
      }
      
      // Generic error
      const arabicError = new Error(`حدث خطأ ما في الاتصال بقاعدة البيانات: ${errorMsg}\n\nيرجى التحقق من:\n1. ملف .env يحتوي على DATABASE_URL صحيح\n2. عنوان IP الخاص بك موجود في MongoDB Atlas Network Access\n3. اتصال الإنترنت يعمل بشكل صحيح`)
      arabicError.name = 'MongoDBError'
      throw arabicError
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e: any) {
    cached.promise = null
    // Re-throw the error (it already has Arabic message from catch block above)
    throw e
  }

  return cached.conn
}

export default connectDB


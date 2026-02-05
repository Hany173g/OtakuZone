import { z } from 'zod'

// Helper function to translate Zod errors to Arabic
export function translateZodError(error: z.ZodError): string {
  const firstError = error.errors[0]
  
  if (firstError.code === 'too_small') {
    if (firstError.type === 'string') {
      return `يجب أن يكون ${firstError.path.join('.')} على الأقل ${firstError.minimum} حرف`
    }
    if (firstError.type === 'number') {
      return `يجب أن يكون ${firstError.path.join('.')} على الأقل ${firstError.minimum}`
    }
  }
  
  if (firstError.code === 'too_big') {
    if (firstError.type === 'string') {
      return `يجب أن يكون ${firstError.path.join('.')} على الأكثر ${firstError.maximum} حرف`
    }
    if (firstError.type === 'number') {
      return `يجب أن يكون ${firstError.path.join('.')} على الأكثر ${firstError.maximum}`
    }
  }
  
  if (firstError.code === 'invalid_type') {
    return `نوع البيانات غير صحيح لـ ${firstError.path.join('.')}`
  }
  
  if (firstError.code === 'invalid_enum_value') {
    return `قيمة غير صحيحة لـ ${firstError.path.join('.')}`
  }
  
  // Default fallback
  return firstError.message || 'حدث خطأ في التحقق من البيانات'
}

// Helper function to create error response in Arabic
export function createErrorResponse(message: string, status: number = 500, details?: any) {
  return {
    error: message,
    ...(details && { details }),
  }
}

// Common error messages in Arabic
export const ERROR_MESSAGES = {
  DB_CONNECTION: 'فشل الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.',
  DB_QUERY: 'حدث خطأ في استعلام قاعدة البيانات',
  NOT_FOUND: 'لم يتم العثور على المورد المطلوب',
  UNAUTHORIZED: 'يجب تسجيل الدخول للوصول إلى هذا المورد',
  FORBIDDEN: 'ليس لديك صلاحية للوصول إلى هذا المورد',
  VALIDATION_ERROR: 'بيانات غير صحيحة',
  UNKNOWN_ERROR: 'حدث خطأ ما',
  CREATE_FAILED: 'فشل إنشاء المورد',
  UPDATE_FAILED: 'فشل تحديث المورد',
  DELETE_FAILED: 'فشل حذف المورد',
  FETCH_FAILED: 'فشل جلب البيانات',
  ALREADY_EXISTS: 'هذا المورد موجود بالفعل',
  INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
  SERVER_ERROR: 'حدث خطأ في الخادم',
}


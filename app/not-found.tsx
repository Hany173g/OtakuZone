import Link from 'next/link'
import { Home, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center animate-fade-in">
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-anime-purple via-anime-pink to-anime-blue bg-clip-text text-transparent mb-4">
            404
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-anime-purple to-anime-pink mx-auto rounded-full"></div>
        </div>
        
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          الصفحة غير موجودة
        </h2>
        
        <p className="text-gray-600 mb-8 text-lg">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-anime-purple to-anime-pink text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <Home className="w-5 h-5" />
            العودة للصفحة الرئيسية
          </Link>
          
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 bg-white border-2 border-anime-purple text-anime-purple px-8 py-4 rounded-lg font-semibold hover:bg-purple-50 transition-all transform hover:-translate-y-1"
          >
            المنتدى
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        
        <div className="mt-12 grid grid-cols-2 gap-4 text-right">
          <Link href="/forum" className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-anime-purple font-semibold">المنتدى</div>
            <div className="text-sm text-gray-600">استكشف المواضيع</div>
          </Link>
          <Link href="/categories" className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-anime-purple font-semibold">التصنيفات</div>
            <div className="text-sm text-gray-600">تصفح التصنيفات</div>
          </Link>
        </div>
      </div>
    </div>
  )
}


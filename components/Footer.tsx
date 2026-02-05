import Link from 'next/link'
import { Github, Twitter, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white mt-24 border-t-4 border-purple-500 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">OtakuZone</h3>
            <p className="text-gray-400">
              مجتمعك المفضل لمناقشة الأنمي والمانجا والترشيحات والتقييمات
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/forum" className="hover:text-white transition">
                  المنتدى
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white transition">
                  التصنيفات
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  عن الموقع
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-white transition">
                  القواعد
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">تصنيفات شائعة</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/forum/shounen" className="hover:text-white transition">
                  شونين
                </Link>
              </li>
              <li>
                <Link href="/forum/isekai" className="hover:text-white transition">
                  إيسيكاي
                </Link>
              </li>
              <li>
                <Link href="/forum/romance" className="hover:text-white transition">
                  رومانس
                </Link>
              </li>
              <li>
                <Link href="/forum/action" className="hover:text-white transition">
                  أكشن
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">تابعنا</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition"
                aria-label="GitHub"
              >
                <Github className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-10 text-center text-gray-400">
          <p>
            © {new Date().getFullYear()} OtakuZone. جميع الحقوق محفوظة.
          </p>
          <p className="mt-2 text-sm">
            هذا الموقع لا يستضيف محتوى أنمي. جميع الروابط من مصادر رسمية فقط.
          </p>
        </div>
      </div>
    </footer>
  )
}


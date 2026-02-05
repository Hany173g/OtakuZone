'use client'

import Link from 'next/link'
import { Search, User, Menu, X, LogOut, Heart, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import NotificationBell from './NotificationBell'
import ThemeToggle from './ThemeToggle'
import Image from 'next/image'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        // User not logged in
      }
    }
    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b-2 border-purple-100 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="OtakuZone"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <span className="hidden sm:inline-block mr-3 text-lg font-extrabold text-slate-900 dark:text-slate-100">
              OtakuZone
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث عن مواضيع أو أنمي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                  }
                }}
              />
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/forum" className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium transition">
              المنتدى
            </Link>
            <Link href="/categories" className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium transition">
              التصنيفات
            </Link>
            <Link href="/top-users" className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium transition">
              أفضل المستخدمين
            </Link>
            <Link href="/groups" className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium transition">
              المجتمع
            </Link>
            {user && (
              <Link href="/messages" className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium transition flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                الرسائل
              </Link>
            )}
            {user && (
              <Link href="/favorites" className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium transition">
                المفضلة
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/forum/dashboard" className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium transition">
                Dashboard المنتدى
              </Link>
            )}
            {user ? (
              <>
                <ThemeToggle />
                <NotificationBell userId={user.id} />
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-anime-purple transition"
                >
                  <img
                    src={user.image || '/default-avatar.svg'}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium">{user.name || 'مستخدم'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-red-600 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span>تسجيل الخروج</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link href="/login" className="flex items-center gap-2 bg-anime-purple text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                  <User className="w-5 h-5" />
                  تسجيل الدخول
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
          {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-end mb-3">
                <ThemeToggle />
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-anime-purple bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery) {
                      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="/forum"
                className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                المنتدى
              </Link>
              <Link
                href="/categories"
                className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                التصنيفات
              </Link>
              <Link
                href="/top-users"
                className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                أفضل المستخدمين
              </Link>
              <Link
                href="/groups"
                className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                المجتمع
              </Link>
              {user && (
                <Link
                  href="/messages"
                  className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="w-5 h-5 inline-block ml-2" />
                  الرسائل
                </Link>
              )}
              {user && (
                <Link
                  href="/favorites"
                  className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Heart className="w-5 h-5 inline-block ml-2" />
                  المفضلة
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  href="/forum/dashboard"
                  className="text-gray-700 dark:text-gray-200 hover:text-anime-purple font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard المنتدى
                </Link>
              )}
              {user ? (
                <>
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-anime-purple"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    {user.name || 'مستخدم'}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-5 h-5" />
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-anime-purple"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

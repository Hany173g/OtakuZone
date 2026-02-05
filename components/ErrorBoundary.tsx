'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Error caught by boundary:', error)
      setError(error.error)
      setHasError(true)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  const handleReset = () => {
    setHasError(false)
    setError(null)
    window.location.reload()
  }

  if (hasError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">
            عذراً، حدث خطأ
          </h2>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            {error?.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleReset}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

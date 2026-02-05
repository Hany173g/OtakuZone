'use client'

import { Twitter, Facebook, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ShareButtonsProps {
  title: string
  url: string
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [mounted, setMounted] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareUrl = encodeURIComponent(url)
  const shareTitle = encodeURIComponent(title)

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    reddit: `https://reddit.com/submit?url=${shareUrl}&title=${shareTitle}`,
  }

  useEffect(() => {
    setMounted(true)
    setCanNativeShare(typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function')
  }, [])

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title,
          url,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    }
  }

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
        return
      }
    } catch {
      // ignore
    }

    try {
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-gray-600 font-medium">شارك:</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-600 font-medium">شارك:</span>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-blue-400 hover:text-blue-500 transition"
      >
        <Twitter className="w-5 h-5" />
        <span>تويتر</span>
      </a>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
      >
        <Facebook className="w-5 h-5" />
        <span>فيسبوك</span>
      </a>
      <a
        href={shareLinks.reddit}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-orange-500 hover:text-orange-600 transition"
      >
        <Share2 className="w-5 h-5" />
        <span>ريديت</span>
      </a>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-700 transition"
        type="button"
      >
        <Share2 className="w-5 h-5" />
        <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
      </button>
      {canNativeShare && (
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 transition"
          type="button"
        >
          <Share2 className="w-5 h-5" />
          <span>مشاركة</span>
        </button>
      )}
    </div>
  )
}


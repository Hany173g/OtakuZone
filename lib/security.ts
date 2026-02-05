import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 'del',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'id'
    ],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitize plain text to prevent XSS in text content
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;')
}

/**
 * Validate and sanitize MongoDB ObjectId
 */
export function sanitizeObjectId(id: string): string | null {
  if (!id || typeof id !== 'string') return null
  // Remove any non-hex characters
  const sanitized = id.replace(/[^0-9a-fA-F]/g, '')
  // Must be 24 characters
  return sanitized.length === 24 ? sanitized : null
}

/**
 * Validate and sanitize slug
 */
export function sanitizeSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') return ''
  // Remove any potentially dangerous characters
  return slug.replace(/[<>'"&]/g, '').trim()
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  try {
    const parsed = new URL(url)
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return url
  } catch {
    return null
  }
}

/**
 * Rate limiting helper - check if request is allowed
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private readonly limit: number
  private readonly windowMs: number

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const timestamps = this.requests.get(identifier) || []
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs)
    
    if (validTimestamps.length >= this.limit) {
      return false
    }
    
    validTimestamps.push(now)
    this.requests.set(identifier, validTimestamps)
    return true
  }
}

/**
 * Input validation helpers
 */
export const validators = {
  name: (name: string): boolean => {
    return typeof name === 'string' && name.length >= 2 && name.length <= 50
  },
  
  title: (title: string): boolean => {
    return typeof title === 'string' && title.length >= 3 && title.length <= 200
  },
  
  content: (content: string): boolean => {
    return typeof content === 'string' && content.length >= 10 && content.length <= 50000
  },
  
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  password: (password: string): boolean => {
    return typeof password === 'string' && password.length >= 6
  },
}

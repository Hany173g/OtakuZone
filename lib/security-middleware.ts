import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

/**
 * Validate MongoDB ObjectId to prevent NoSQL injection
 */
export function validateObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24
}

/**
 * Sanitize string input to remove NoSQL operators
 */
export function sanitizeNoSQL(input: any): any {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    return input.replace(/\$[a-zA-Z]+/g, '')
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeNoSQL)
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      // Remove keys that start with $ (MongoDB operators)
      if (!key.startsWith('$')) {
        sanitized[key] = sanitizeNoSQL(value)
      }
    }
    return sanitized
  }
  return input
}

/**
 * Validate and parse skip/limit for pagination
 */
export function parsePaginationParams(searchParams: URLSearchParams): { skip: number; limit: number } {
  const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), 100)
  return { skip, limit }
}

/**
 * Rate limiter for API endpoints
 */
export class SimpleRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    if (record.count >= this.maxRequests) {
      return false
    }

    record.count++
    return true
  }
}

// Global rate limiter instance
export const apiRateLimiter = new SimpleRateLimiter(100, 60000)

/**
 * Middleware to check rate limiting
 */
export function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.ip || 'unknown'
  
  if (!apiRateLimiter.isAllowed(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }
  
  return null
}

/**
 * Validate enum values to prevent injection
 */
export function validateEnum(value: string, validValues: string[]): boolean {
  return validValues.includes(value)
}

/**
 * Sanitize slug for URL parameters
 */
export function sanitizeSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') return ''
  // Only allow alphanumeric, hyphens, and underscores
  return slug.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 100)
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.jikan.moe;",
}

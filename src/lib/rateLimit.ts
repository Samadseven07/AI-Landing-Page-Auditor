// Simple in-memory rate limit for development
const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(userId: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now()
  const user = requestCounts.get(userId)

  if (!user || now > user.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (user.count >= maxRequests) {
    return false
  }

  user.count += 1
  return true
}
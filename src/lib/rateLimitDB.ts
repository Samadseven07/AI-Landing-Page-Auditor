import { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from './supabaseServer'

export async function checkRateLimit(user: any) {
  const SUPER_USER = process.env.SUPER_USER_EMAIL
  const LIMIT = parseInt(process.env.AUDIT_LIMIT_PER_DAY || '3')
  const WINDOW_HOURS = parseInt(process.env.AUDIT_WINDOW_HOURS || '24')

  if (user.email === SUPER_USER) {
    return { allowed: true }
  }

  const supabase = await createServerClient()
  const twentyFourHoursAgo = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
  
  const { count, error } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', twentyFourHoursAgo)

  if (error) {
    console.error('Rate limit check failed:', error)
    return { allowed: true } // Fail open
  }

  if (count !== null && count >= LIMIT) {
    return {
      allowed: false,
      error: `Audit limit reached. You can perform ${LIMIT} audits every ${WINDOW_HOURS} hours. Your limit will reset soon.`
    }
  }

  return { allowed: true }
}


export async function checkDBAuditLimit(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | undefined
): Promise<{ allowed: boolean; error?: string }> {
  const SUPER_USER = process.env.SUPER_USER_EMAIL
  const LIMIT = parseInt(process.env.AUDIT_LIMIT_PER_DAY || '3')
  const WINDOW_HOURS = parseInt(process.env.AUDIT_WINDOW_HOURS || '24')

  if (userEmail === SUPER_USER) return { allowed: true }

  const windowStart = new Date(
    Date.now() - WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString()

  const { count, error } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart)

  if (error) return { allowed: true } // fail open

  if (count !== null && count >= LIMIT) {
    return {
      allowed: false,
      error: `Audit limit reached. You can run ${LIMIT} audits every ${WINDOW_HOURS} hours.`,
    }
  }

  return { allowed: true }
}
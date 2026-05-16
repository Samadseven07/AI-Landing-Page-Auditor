import { createServerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = await createServerClient()

  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/login', requestUrl.origin), {
    status: 301,
  })
}
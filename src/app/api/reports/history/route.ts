import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const { data } = await supabase
    .from('reports')
    .select('id, overall_score, seo_score, ux_score, copywriting_score, created_at')
    .eq('user_id', user.id)
    .eq('url', url)
    .order('created_at', { ascending: true })
    .limit(10)

  return NextResponse.json({ history: data || [] })
}

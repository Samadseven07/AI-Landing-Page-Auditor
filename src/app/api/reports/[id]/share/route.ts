import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { randomBytes } from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const shareToken = randomBytes(16).toString('hex')

  const { data, error } = await supabase
    .from('reports')
    .update({ is_public: true, share_token: shareToken })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('share_token')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ shareToken: data.share_token })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await supabase
    .from('reports')
    .update({ is_public: false, share_token: null })
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}

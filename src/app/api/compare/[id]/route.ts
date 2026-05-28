import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Owner check: verify comparison exists and belongs to the user
    const { data: comparison, error: fetchError } = await supabase
      .from('comparisons')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !comparison) {
      console.warn(`User ${user.id} tried to delete comparison ${id} which does not exist or they do not own.`)
      return NextResponse.json({ error: 'Comparison not found or permission denied' }, { status: 404 })
    }

    // Use admin client to bypass any missing RLS delete policies
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error: deleteError } = await supabaseAdmin
      .from('comparisons')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to delete comparison:', deleteError)
      return NextResponse.json({ error: 'Failed to delete comparison' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete comparison API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

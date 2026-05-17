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

    // 1. Owner check: Verify that the report exists and belongs to the authenticated user
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !report) {
      console.warn(`User ${user.id} tried to delete report ${id} which does not exist or they do not own.`)
      return NextResponse.json({ error: 'Report not found or permission denied' }, { status: 404 })
    }

    // 2. Initialize the Admin client to bypass any missing RLS delete policies
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    )

    // 3. Delete associated findings first to prevent foreign key constraint violations
    const { error: findingsError } = await supabaseAdmin
      .from('findings')
      .delete()
      .eq('report_id', id)

    if (findingsError) {
      console.error('Failed to delete associated findings:', findingsError)
      return NextResponse.json({ error: 'Failed to delete report findings' }, { status: 500 })
    }

    // 4. Delete the report itself using the Admin client
    const { error: reportDeleteError } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', id)

    if (reportDeleteError) {
      console.error('Failed to delete report:', reportDeleteError)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

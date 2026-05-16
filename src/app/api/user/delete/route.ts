import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    // 1. Verify Service Role Key exists
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'System Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local' 
      }, { status: 500 })
    }

    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Session expired or invalid' }, { status: 401 })
    }

    const email = user.email

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()

    // 2. Log the deletion
    try {
      const { error: logError } = await adminClient
        .from('deleted_accounts')
        .insert({
          email: email,
          user_id: user.id,
          deleted_at: new Date().toISOString()
        })

      if (logError) {
        console.error('Failed to log deletion:', logError)
        return NextResponse.json({ 
          error: 'Database Error: Please ensure the "deleted_accounts" table exists in Supabase. Check the SQL instructions I provided.' 
        }, { status: 500 })
      }
    } catch (err) {
      return NextResponse.json({ error: 'Failed to access deleted_accounts table' }, { status: 500 })
    }

    // 3. Delete user data (reports)
    await adminClient.from('reports').delete().eq('user_id', user.id)

    // 4. Delete from Supabase Auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Auth deletion error:', deleteError)
      return NextResponse.json({ error: 'Auth System Error: ' + deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected deletion error:', error)
    return NextResponse.json({ 
      error: 'Unexpected server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}

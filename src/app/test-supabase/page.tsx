// src/app/test-supabase/page.tsx
import { supabase } from '@/lib/supabaseClient'

export default async function TestPage() {
  const { data, error } = await supabase.from('profiles').select('*')
  
  if (error) return <div>Error: {error.message}</div>
  return <div>Connected! Data: {JSON.stringify(data)}</div>
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getProfile()
  }, [router])

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      let data
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json()
      } else {
        const text = await res.text()
        console.error('Non-JSON response:', text)
        throw new Error(`Server Error (${res.status}): The API returned an invalid response. Please check your .env.local configuration.`)
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      // Success
      await supabase.auth.signOut()
      router.push('/login?message=Account deleted successfully')
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <div className="text-zinc-400 font-medium animate-pulse">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-purple-500/30 relative">
      <div className="fixed inset-0 bg-grid-white -z-10"></div>
      
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-110">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Auditor AI</h1>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tight">Account Settings</h2>
          <p className="text-zinc-500 font-medium text-lg">Manage your profile and security preferences.</p>
        </div>

        <div className="glass-card p-10 rounded-[2.5rem] border-white/5 space-y-10 shadow-2xl relative overflow-hidden">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Address</label>
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-white font-bold">{user?.email}</div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">User ID</label>
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-500 font-mono text-xs">{user?.id}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-10 border-t border-zinc-800/50">
            <h3 className="text-xl font-black text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-4">Danger Zone</h3>
            <div className="space-y-4">
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                Deleting your account will permanently remove all your audits, reports, and personal data. 
                <span className="text-red-400 font-bold block mt-2">
                  Important: You will not be able to re-create an account with this email address for 72 hours (3 days).
                </span>
              </p>
              
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-6 p-6 bg-red-500/5 rounded-3xl border border-red-500/20 animate-in fade-in slide-in-from-top-4">
                  <p className="text-white font-bold">Are you absolutely sure?</p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {deleting ? 'Processing...' : 'Yes, Delete Permanently'}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold animate-in shake-in">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
            Account Management System &copy; 2026
          </div>
        </div>
      </footer>
    </div>
  )
}

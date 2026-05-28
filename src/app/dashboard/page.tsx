'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([])
  const [comparisons, setComparisons] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setSession(session)
      fetchData(session.user.id)
    }
    checkUser()
  }, [router])

  const fetchData = async (userId: string) => {
    const [reportsRes, compRes] = await Promise.all([
      supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('comparisons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
    ])
    
    setReports(reportsRes.data || [])
    setComparisons(compRes.data || [])
    setLoading(false)
  }

  const handleDeleteReport = async () => {
    if (!deleteId) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/reports/${deleteId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setReports(reports.filter(r => r.id !== deleteId))
        setDeleteId(null)
      } else {
        alert('Failed to delete report')
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  const avgScore = reports && reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + (r.overall_score || 0), 0) / reports.length)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <div className="text-zinc-400 font-medium animate-pulse">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-purple-500/30">
      <div className="fixed inset-0 bg-grid-white -z-10"></div>
      
      {/* Custom Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
          <div className="relative glass-card max-w-sm w-full p-8 rounded-[2.5rem] border-white/5 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white">Delete Audit?</h3>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                This action is permanent and cannot be undone. All data for this report will be lost.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                disabled={deleting}
                onClick={handleDeleteReport}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
              <button
                disabled={deleting}
                onClick={() => setDeleteId(null)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Auditor AI</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4">
                <Link href="/compare" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Compare
                </Link>
                <Link href="/dashboard/leads" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Leads
                </Link>
              </div>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-white">{session?.user?.email?.split('@')[0]}</span>
                <span className="text-[10px] font-medium text-zinc-500">{session?.user?.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Link 
                  href="/dashboard/settings" 
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                  title="Account Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </Link>

                <button 
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/login')
                  }}
                  className="p-2 text-zinc-400 hover:text-white transition-colors" 
                  title="Sign Out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 blur-[40px] -z-10 transition-all group-hover:bg-purple-600/20"></div>
            <div className="text-zinc-500 text-xs font-black uppercase tracking-widest">Total Audits</div>
            <div className="text-4xl font-black text-white">{reports?.length || 0}</div>
          </div>
          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 blur-[40px] -z-10 transition-all group-hover:bg-emerald-600/20"></div>
            <div className="text-zinc-500 text-xs font-black uppercase tracking-widest">Average Score</div>
            <div className="text-4xl font-black text-white">{avgScore}<span className="text-lg text-zinc-600">/100</span></div>
          </div>
          <div className="flex items-center justify-center p-2">
            <Link 
              href="/audit"
              className="w-full h-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-950 rounded-[2rem] font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              New Audit
            </Link>
          </div>
        </div>

        {/* Audit List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">Recent Analysis</h2>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Showing {reports?.length || 0} results</div>
          </div>

          {reports && reports.length > 0 ? (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="group relative"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/0 to-indigo-600/0 rounded-3xl opacity-0 group-hover:from-purple-600/20 group-hover:to-indigo-600/20 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative glass-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between border-white/5 transition-all group-hover:bg-zinc-900/80 gap-6">
                    <div 
                      className="flex-1 flex items-start sm:items-center gap-4 sm:gap-6 cursor-pointer min-w-0"
                      onClick={() => router.push(`/report/${report.id}`)}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:border-purple-500/50 group-hover:text-purple-400 transition-all shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-purple-400 transition-colors truncate">
                          {report.url.replace('https://', '').replace('http://', '')}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                            {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-800 shrink-0"></span>
                          <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/10 rounded whitespace-nowrap">Completed</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-10 border-t border-white/5 sm:border-0 pt-4 sm:pt-0">
                      <div 
                        className="flex items-center gap-3 sm:block text-left sm:text-right cursor-pointer"
                        onClick={() => router.push(`/report/${report.id}`)}
                      >
                        <div className="text-xl sm:text-2xl font-black text-white group-hover:text-glow-purple transition-all">
                          {report.overall_score}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Score</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(report.id)
                          }}
                          className="p-2.5 sm:p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all relative z-10"
                          title="Delete Report"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        <div 
                          className="p-2 text-zinc-700 group-hover:text-white transition-colors hidden sm:block cursor-pointer"
                          onClick={() => router.push(`/report/${report.id}`)}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-[3rem] border-white/5 py-24 text-center space-y-8">
              <div className="w-20 h-20 bg-zinc-900 rounded-3xl border border-zinc-800 mx-auto flex items-center justify-center text-zinc-700">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">No audits detected</h3>
                <p className="text-zinc-500 text-sm font-medium">Start your first AI analysis to see insights here.</p>
              </div>
              <Link 
                href="/audit"
                className="inline-flex px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-purple-900/20"
              >
                Audit Your First Page
              </Link>
            </div>
          )}
        </div>
        {/* Comparisons List */}
        {comparisons && comparisons.length > 0 && (
          <div className="space-y-6 pt-12 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">Recent Comparisons</h2>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Showing {comparisons.length} results</div>
            </div>

            <div className="grid gap-4">
              {comparisons.map((comp) => (
                <div 
                  key={comp.id} 
                  className="group relative cursor-pointer"
                  onClick={() => router.push(`/compare/${comp.id}`)}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/0 to-cyan-600/0 rounded-3xl opacity-0 group-hover:from-blue-600/20 group-hover:to-cyan-600/20 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative glass-card p-6 rounded-3xl border-white/5 transition-all group-hover:bg-zinc-900/80">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-zinc-400">Site A:</span>
                          <a href={comp.url_a} target="_blank" rel="noreferrer" className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate max-w-[200px] sm:max-w-xs">{comp.url_a.replace('https://', '').replace('http://', '')}</a>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-zinc-400">Site B:</span>
                          <a href={comp.url_b} target="_blank" rel="noreferrer" className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate max-w-[200px] sm:max-w-xs">{comp.url_b.replace('https://', '').replace('http://', '')}</a>
                        </div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
                          {new Date(comp.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 border-t border-zinc-800 sm:border-0 pt-4 sm:pt-0 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-center">
                          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Winner</div>
                          <div className="text-sm font-black text-emerald-400">
                            {comp.winner === 'A' ? 'Site A' : comp.winner === 'B' ? 'Site B' : 'Tie'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
            Auditor AI Control Panel &copy; 2026
          </div>
        </div>
      </footer>
    </div>
  )
}
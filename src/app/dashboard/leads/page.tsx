'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('leads')
      .select(`
        *,
        reports (
          url,
          overall_score
        )
      `)
      .order('created_at', { ascending: false })

    setLeads(data || [])
    setLoading(false)
  }

  const exportToCSV = () => {
    const headers = ['Email', 'URL', 'Score', 'Date']
    const rows = leads.map(lead => {
      const report = Array.isArray(lead.reports) ? lead.reports[0] : lead.reports
      return [
        lead.email,
        report?.url || 'N/A',
        report?.overall_score || 0,
        new Date(lead.created_at).toLocaleDateString(),
      ]
    })

    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${Date.now()}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <div className="text-zinc-400 font-medium animate-pulse">Syncing lead database...</div>
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
              <button
                onClick={exportToCSV}
                className="group relative flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 rounded-full text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-tight">Leads Engine</h2>
            <p className="text-zinc-500 font-medium">Monitoring conversion captures and user interest.</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Database Live</span>
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Capture Node</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Source Entity</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Score Delta</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.map((lead) => {
                const report = Array.isArray(lead.reports) ? lead.reports[0] : lead.reports
                const score = report?.overall_score || 0
                return (
                  <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:border-purple-500/50 group-hover:text-purple-400 transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white tracking-tight">{lead.email}</div>
                          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">ID: {lead.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-xs font-bold text-zinc-400 truncate max-w-[200px]">
                        {report?.url?.replace('https://', '').replace('http://', '') || 'Direct Capture'}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {score} pts
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="text-xs font-bold text-zinc-500">
                        {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 mx-auto flex items-center justify-center text-zinc-700">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Capture sequence empty</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="mt-20 py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
            Leads Management Console &copy; 2026
          </div>
        </div>
      </footer>
    </div>
  )
}
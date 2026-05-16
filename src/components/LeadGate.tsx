'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface LeadGateProps {
  reportId: string
  url: string
  onEmailSubmit: () => void
}

export default function LeadGate({ reportId, url, onEmailSubmit }: LeadGateProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Save lead to Supabase
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          email,
          report_id: reportId,
          url,
          source: 'audit_report',
        })

      if (insertError) {
        // If the error is "duplicate key" (23505), it means they already submitted
        if (insertError.code === '23505') {
          // Allow them to proceed anyway as they've already given their email
          onEmailSubmit()
          return
        }
        throw insertError
      }

      onEmailSubmit()
    } catch (err) {
      console.error('Lead capture error:', err)
      setError('Failed to secure access. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 backdrop-blur-2xl bg-zinc-950/70 animate-in fade-in duration-700">
      <div className="max-w-md w-full relative">
        <div className="relative glass-card p-10 rounded-[2.5rem] border-white/10 shadow-2xl space-y-8 bg-zinc-900/90">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl ring-1 ring-white/20">
              <svg className="w-8 h-8 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Unlock Analysis</h2>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">
              To view the full intelligence report and download the PDF roadmap, please verify your email.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 transition-all hover:border-zinc-700/50">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-xs font-bold text-zinc-300">Actionable Copy Suggestions</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 transition-all hover:border-zinc-700/50">
              <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-xs font-bold text-zinc-300">Conversion Architecture Audit</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email address"
                className="w-full pl-12 pr-4 py-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-bold"
                autoFocus
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold animate-in fade-in slide-in-from-top-2 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-white/5"
            >
              {loading ? 'Processing...' : 'Unlock Full Report'}
            </button>

            <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-widest pt-2">
              Instant Access • One-Click PDF Export
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
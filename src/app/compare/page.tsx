'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ComparePage() {
  const router = useRouter()
  const [urlA, setUrlA] = useState('')
  const [urlB, setUrlB] = useState('')
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (loading) {
      setElapsed(0)
      interval = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [loading])

  const handleCompare = async () => {
    if (!urlA.startsWith('http') || !urlB.startsWith('http')) {
      setError('Please enter valid URLs starting with http/https')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ urlA, urlB }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Comparison failed')
      }
      const data = await res.json()
      router.push(`/compare/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-purple-500/30 relative">
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
            <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Competitor Comparison</h1>
          <p className="text-zinc-400 text-lg font-medium">Audit two landing pages side by side. AI picks the winner.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Your Site</label>
            <input
              type="url"
              placeholder="https://yoursite.com"
              value={urlA}
              onChange={e => setUrlA(e.target.value)}
              className="w-full px-4 py-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-bold transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Competitor</label>
            <input
              type="url"
              placeholder="https://competitor.com"
              value={urlB}
              onChange={e => setUrlB(e.target.value)}
              className="w-full px-4 py-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 font-bold transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center animate-in fade-in break-words">
            {error}
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={loading}
          className="px-10 py-5 bg-white text-zinc-950 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl"
        >
          {loading ? 'Comparing' : 'Compare Pages'}
        </button>

        {/* Loading UI */}
        {loading && (
          <div className="mt-12 space-y-6 max-w-sm mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-white">{elapsed}s</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-black text-white flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                Analyzing Competitors
              </div>
              <p className="text-sm font-medium text-zinc-500">
                {elapsed < 10 ? 'Visiting both pages...' : elapsed < 20 ? 'Running SEO checks...' : 'AI is picking the winner...'}
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
            Competitor Analysis Engine &copy; 2026
          </div>
        </div>
      </footer>
    </div>
  )
}

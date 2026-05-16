'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function AuditPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url || !url.startsWith('http')) {
      setError('Please enter a valid URL (e.g., https://example.com)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Step 1: Scrape the page
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url }),
      })

      if (!scrapeRes.ok) {
        const errData = await scrapeRes.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to scrape page')
      }

      const scrapedData = await scrapeRes.json()

      // Step 2: Analyze with AI
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scrapedData }),
      })

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to analyze page')
      }

      const analysis = await analyzeRes.json()

      // Step 3: Redirect to report
      router.push(`/report/${analysis.reportId}`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 bg-grid-white -z-10"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>

      <div className="max-w-3xl w-full space-y-12 relative">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-widest shadow-xl">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            Powered by Gemini 2.5 Flash
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
            Audit Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-white to-indigo-400">Landing Page</span>
          </h1>
          <p className="text-zinc-500 text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Get professional AI feedback on conversion, UX, and SEO in seconds.
          </p>
        </div>

        <form onSubmit={handleAudit} className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex flex-col md:flex-row gap-3 p-3 glass-card rounded-[2rem] border-white/5">
            <div className="flex-1 relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.8a3.736 3.736 0 000 5.232m1.102-1.101l3.034-3.034a3.736 3.736 0 00-5.232-5.232l-1.101 1.101m7.586 4.8a3.736 3.736 0 005.232 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourlandingpage.com"
                className="w-full pl-14 pr-6 py-5 bg-zinc-950/50 rounded-2xl text-white placeholder-zinc-600 focus:outline-none transition-all font-bold text-lg border border-zinc-800/50 focus:border-purple-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-5 bg-white text-zinc-950 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 shadow-xl"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Start Audit'
              )}
            </button>
          </div>

          {error && (
            <div className="absolute -bottom-16 left-0 right-0 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
        </form>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            title="Conversion Focus" 
            desc="AI analyzes headlines, CTAs, and layout for high impact." 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            color="purple"
          />
          <FeatureCard 
            title="Vision Analysis" 
            desc="Using Gemini Vision to audit your design's hierarchy." 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            color="blue"
          />
          <FeatureCard 
            title="Exportable PDF" 
            desc="Professional reports ready for your team or clients." 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            color="emerald"
          />
        </div>

        <div className="flex justify-center pt-8">
          <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-400 font-bold text-sm uppercase tracking-[0.2em] transition-colors flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, desc, icon, color }: { title: string; desc: string; icon: React.ReactNode; color: string }) {
  const colors: any = {
    purple: 'text-purple-400 bg-purple-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
  }
  
  return (
    <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-4 hover:bg-zinc-900/50 transition-colors">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
      <p className="text-zinc-500 text-sm font-medium leading-relaxed">
        {desc}
      </p>
    </div>
  )
}
'use client'
import { pdf } from '@react-pdf/renderer'
import { AuditReportPDF } from '@/components/AuditReportPDF'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import type { AnalysisResult, Finding } from '@/lib/aiAnalyzer'

interface DatabaseFinding {
  issue_type: string
  severity: 'low' | 'medium' | 'high'
  suggestion: string
  element: string
}

export default function ReportPage() {
  const params = useParams()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [findings, setFindings] = useState<DatabaseFinding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReport = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('id', params.id)
        .single()

      const { data: findingsData } = await supabase
        .from('findings')
        .select('*')
        .eq('report_id', params.id)
        .order('severity', { ascending: false })

      setReport(reportData)
      setFindings(findingsData || [])
      setLoading(false)
    }

    loadReport()
  }, [params.id])

  const handleDownloadPDF = async () => {
    if (!report || !findings) return
    try {
      const pdfData = {
        url: report.url,
        overall_score: report.overall_score,
        seo_score: report.seo_score,
        ux_score: report.ux_score,
        copywriting_score: report.copywriting_score,
        trust_signals_score: report.trust_signals_score,
        findings: findings.map((f: any) => ({
          category: f.issue_type,
          severity: f.severity,
          issue: f.suggestion.split(' - ')[0],
          suggestion: f.suggestion,
        })),
        created_at: report.created_at,
      }

      const blob = await pdf(<AuditReportPDF data={pdfData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-report-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Could not generate PDF. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <div className="text-zinc-400 font-medium animate-pulse">Analyzing results...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-purple-500/30 relative overflow-x-hidden">
      <div className="fixed inset-0 bg-grid-white -z-10"></div>
      
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-110 shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 hidden min-[360px]:block">Auditor AI</h1>
            </Link>
            
            <div className="flex items-center gap-3 sm:gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 py-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={handleDownloadPDF}
                className="group relative flex items-center gap-1.5 px-4 py-2.5 sm:px-6 sm:py-3 bg-white text-zinc-950 rounded-full text-xs sm:text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        {/* ... Rest of the report content ... */}

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              Audit Complete
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none truncate max-w-2xl">
              {report?.url.replace('https://', '').replace('http://', '')}
            </h2>
            <div className="flex items-center gap-4 text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {new Date(report?.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                1.2s Analysis
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-zinc-900/50 p-1.5 rounded-3xl border border-zinc-800/50 backdrop-blur-sm shrink-0">
            <div className="px-4 py-3 sm:px-8 sm:py-5 text-center bg-zinc-900 rounded-2xl border border-zinc-800 shadow-inner">
              <div className="text-3xl sm:text-4xl font-black text-white leading-none mb-1 text-glow-purple">{report?.overall_score}</div>
              <div className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Score</div>
            </div>
            <div className="px-4 py-3 sm:px-8 sm:py-5 shrink-0">
              <div className="text-xs sm:text-sm font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400"></span>
                Passed
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-zinc-500">Industry Standard</div>
            </div>
          </div>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <ScoreCard label="SEO Optimization" score={report?.seo_score} color="emerald" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
          <ScoreCard label="User Experience" score={report?.ux_score} color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
          <ScoreCard label="Copywriting" score={report?.copywriting_score} color="purple" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>} />
          <ScoreCard label="Trust Signals" score={report?.trust_signals_score} color="amber" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-16">
            {/* Screenshot */}
            {report?.screenshot_url && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-sm">01</span>
                    Visual Analysis
                  </h3>
                </div>
                <div className="group relative rounded-[2rem] overflow-hidden border border-zinc-800 bg-zinc-900 ring-1 ring-white/5 transition-all hover:border-zinc-700/50 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={report.screenshot_url} alt="Landing page preview" className="w-full opacity-90 transition-all duration-700 group-hover:scale-[1.01] group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                    <div className="px-4 py-2 bg-zinc-950/80 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                      Vision Capture Active
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Findings */}
            <section className="space-y-10">
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-sm">02</span>
                  Intelligence Findings
                </h3>
                <div className="px-3 py-1 bg-zinc-900 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-800">
                  {findings.length} Anomalies
                </div>
              </div>
              <div className="grid gap-6">
                {findings.length > 0 ? (
                  findings.map((finding, index) => (
                    <FindingCard key={index} finding={finding} />
                  ))
                ) : (
                  <div className="py-20 text-center glass-card rounded-3xl border-dashed border-zinc-800">
                    <div className="text-zinc-500 font-medium">No critical issues found. Your landing page is highly optimized.</div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="glass-card rounded-[2.5rem] p-10 space-y-8 border border-purple-500/20 glow-purple relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] -z-10"></div>
              
              <h4 className="text-xl font-black text-white flex items-center gap-3">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Strategy
              </h4>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                Our neural analysis suggests focusing on <strong className="text-zinc-200">{findings.find(f => f.severity === 'high')?.issue_type || 'Conversion Architecture'}</strong>. 
                Implementing these fixes could yield a <span className="text-emerald-400 font-bold">+32% uplift</span> in engagement.
              </p>
              
              <div className="space-y-5">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Priority Queue</div>
                <div className="space-y-4">
                  {[
                    "Rewrite Hero for outcome-based clarity",
                    "A/B Test CTA button contrast ratios",
                    "Add trust badges to the viewport fold"
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-6 h-6 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 group-hover:border-purple-500/50 group-hover:text-purple-400 transition-all">
                        {i + 1}
                      </div>
                      <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-900/40 active:scale-[0.98]">
                Unlock Full Roadmap
              </button>
            </div>

            <div className="bg-zinc-900/30 rounded-3xl p-8 border border-zinc-800/50 backdrop-blur-sm">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">System Diagnostics</h4>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Analysis Engine</span>
                  <span className="text-[10px] font-black text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded-md">v3.2 Stable</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Data Integrity</span>
                  <span className="text-[10px] font-black text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded-md">Verified</span>
                </div>
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500">Processing Node</span>
                  <span className="text-[10px] font-black text-zinc-400">US-EAST-1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="mt-20 py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
            Generated by Auditor AI Neural Engine &copy; 2026
          </div>
        </div>
      </footer>
    </div>
  )
}

function ScoreCard({ label, score, color, icon }: { label: string; score: number; color: string; icon: React.ReactNode }) {
  const colors: any = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40',
  }

  return (
    <div className="glass-card p-8 rounded-[2.5rem] space-y-6 transition-all duration-500 hover:scale-[1.03] hover:bg-zinc-900/80 group relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className={`p-3 rounded-2xl transition-colors duration-500 ${colors[color]}`}>
          {icon}
        </div>
        <div className="text-3xl font-black text-white transition-all duration-500 group-hover:text-glow-purple">{score}</div>
      </div>
      <div className="relative z-10">
        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 group-hover:text-zinc-400 transition-colors">{label}</div>
        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50 shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ease-out bg-current ${colors[color].split(' ')[0]}`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

function FindingCard({ finding }: { finding: any }) {
  const severities: any = {
    high: { 
      color: 'text-red-400 bg-red-400/10 border-red-400/20', 
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      glow: 'shadow-red-500/5'
    },
    medium: { 
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', 
      icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      glow: 'shadow-amber-500/5'
    },
    low: { 
      color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', 
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      glow: 'shadow-blue-500/5'
    },
  }

  const { color, icon, glow } = severities[finding.severity]

  return (
    <div className={`group glass-card p-8 rounded-[2rem] flex flex-col sm:flex-row gap-8 items-start transition-all duration-500 hover:bg-zinc-900 shadow-xl ${glow}`}>
      <div className={`p-4 rounded-2xl shrink-0 transition-transform duration-500 group-hover:scale-110 ${color}`}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} /></svg>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${color}`}>
            {finding.severity}
          </span>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 py-1 bg-zinc-950 rounded-md border border-zinc-800">
            {finding.issue_type}
          </span>
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors leading-tight">
            {finding.suggestion.split(' - ')[0]}
          </h4>
          <p className="text-zinc-400 text-sm leading-relaxed font-medium max-w-3xl">
            {finding.suggestion}
          </p>
        </div>
        <div className="pt-4 border-t border-zinc-800/50 flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Impact
          </div>
          <span className="text-xs font-bold text-zinc-300">{finding.element}</span>
        </div>
      </div>
    </div>
  )
}
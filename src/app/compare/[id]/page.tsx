import { createServerClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ComparisonReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-black text-white mb-4">Unauthorized</h1>
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-bold underline">Login to view</Link>
      </div>
    )
  }

  const { data: comp } = await supabase
    .from('comparisons')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!comp) notFound()

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
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            Comparison Report
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Competitor Analysis</h1>
          <p className="text-zinc-500 text-sm font-medium">
            Analyzed on {new Date(comp.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Site A</div>
            <a href={comp.url_a} target="_blank" rel="noreferrer" className="text-lg font-bold text-white hover:text-blue-400 transition-colors break-all">
              {comp.url_a}
            </a>
          </div>
          <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Site B</div>
            <a href={comp.url_b} target="_blank" rel="noreferrer" className="text-lg font-bold text-white hover:text-blue-400 transition-colors break-all">
              {comp.url_b}
            </a>
          </div>
        </div>

        <div className="space-y-6">
          {/* Winner banner */}
          <div className="p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 text-center">
            <div className="text-emerald-400 font-black text-2xl mb-2">
              🏆 Winner: {comp.winner === 'A' ? comp.url_a.replace('https://', '') : comp.winner === 'B' ? comp.url_b.replace('https://', '') : 'Tie'}
            </div>
            <p className="text-zinc-400 text-sm max-w-2xl mx-auto">{comp.summary}</p>
          </div>

          {/* Key differences */}
          {comp.key_differences?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Key Differences</h3>
              <div className="grid gap-2">
                {comp.key_differences.map((diff: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <span className="text-purple-400 font-black text-sm shrink-0">{i + 1}.</span>
                    <span className="text-sm text-zinc-300 font-medium">{diff}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score comparison table */}
          {comp.comparison_data && (
            <div className="rounded-[2rem] border border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900">
                    <th className="text-left px-6 py-4 text-zinc-400 font-bold">Category</th>
                    <th className="text-center px-6 py-4 text-purple-400 font-bold">Site A</th>
                    <th className="text-center px-6 py-4 text-blue-400 font-bold">Site B</th>
                  </tr>
                </thead>
                <tbody>
                  {comp.comparison_data.map((row: any, i: number) => (
                    <tr key={i} className="border-t border-zinc-800">
                      <td className="px-6 py-4 text-zinc-300 font-medium">{row.category}</td>
                      <td className={`px-6 py-4 text-center font-black ${row.scoreA > row.scoreB ? 'text-emerald-400' : row.scoreA < row.scoreB ? 'text-red-400' : 'text-zinc-400'}`}>
                        {row.scoreA}
                      </td>
                      <td className={`px-6 py-4 text-center font-black ${row.scoreB > row.scoreA ? 'text-emerald-400' : row.scoreB < row.scoreA ? 'text-red-400' : 'text-zinc-400'}`}>
                        {row.scoreB}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

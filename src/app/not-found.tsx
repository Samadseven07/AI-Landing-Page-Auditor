import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-purple-500/30 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-grid-white -z-10"></div>
      
      <div className="relative glass-card max-w-2xl w-full p-8 md:p-16 rounded-[3rem] border-white/5 text-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-lg bg-purple-600/10 blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] -z-10"></div>

        <div className="space-y-8 relative z-10">
          {/* Glitch/404 display */}
          <div className="relative inline-block">
            <h1 className="text-8xl md:text-[9rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-400 to-zinc-800 animate-pulse">
              404
            </h1>
            <div className="absolute -inset-4 bg-purple-500/20 blur-2xl -z-10 rounded-full mix-blend-screen opacity-50"></div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-white">System Breach Detected</h2>
            <p className="text-zinc-500 text-sm md:text-base max-w-md mx-auto font-medium leading-relaxed">
              The sector you are trying to access does not exist in our database. It may have been redacted, deleted, or you simply took a wrong turn in the neural net.
            </p>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-950 hover:bg-zinc-100 rounded-2xl font-black tracking-wide transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Return to Dashboard
            </Link>
            <Link 
              href="/"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl font-black tracking-wide transition-all border border-zinc-800 hover:border-zinc-700 active:scale-95 flex items-center justify-center gap-3"
            >
              System Root
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

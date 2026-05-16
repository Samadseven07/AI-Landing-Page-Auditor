'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { type AnalysisResult, type Finding } from '@/lib/aiAnalyzer'

type ResultType = { analysis: AnalysisResult; reportId?: string; timestamp: string }

export default function TestAI() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<ResultType | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    setLoading(true)
    
    // First scrape
    const { data: { session } } = await supabase.auth.getSession()
    
    const scrapeRes = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ url }),
    })
    
    const scrapedData = await scrapeRes.json()
    
    // Then analyze
    const analyzeRes = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ scrapedData }),
    })
    
    const analysis = await analyzeRes.json()
    setResult(analysis)
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Analyzer Test</h1>
      
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="border p-2 w-full mb-4 rounded"
      />
      
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="bg-purple-600 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze Page'}
      </button>
      
      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-bold">Overall Score</h3>
              <p className="text-3xl text-purple-600">{result.analysis.overallScore}/100</p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-bold">SEO Score</h3>
              <p className="text-3xl text-green-600">{result.analysis.seoScore}/100</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">Findings</h3>
            {result.analysis.findings.map((f: Finding, i: number) => (
              <div key={i} className="border-b py-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  f.severity === 'high' ? 'bg-red-100 text-red-800' :
                  f.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {f.severity}
                </span>
                <p className="mt-1 font-medium">{f.issue}</p>
                <p className="text-sm text-gray-600">{f.suggestion}</p>
              </div>
            ))}
          </div>
          
          {result.analysis.improvedHeadline && (
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="font-bold">Better Headline:</h3>
              <p className="text-purple-900">{result.analysis.improvedHeadline}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
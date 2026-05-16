'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestScrape() {
  const [url, setUrl] = useState('https://example.com')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const handleScrape = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ url }),
    })
    
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="p-8">
      <input 
        value={url} 
        onChange={(e) => setUrl(e.target.value)}
        className="border p-2 w-96"
        placeholder="Enter URL"
      />
      <button 
        onClick={handleScrape} 
        disabled={loading}
        className="ml-4 bg-purple-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Scraping...' : 'Test Scrape'}
      </button>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
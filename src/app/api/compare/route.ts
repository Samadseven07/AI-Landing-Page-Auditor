import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { scrapePage } from '@/lib/scraper'
import { analyzeLandingPage } from '@/lib/aiAnalyzer'
import { checkSEO } from '@/lib/seoChecker'
import { calculateFinalScores } from '@/lib/scorer'
import { checkComparisonRateLimit } from '@/lib/rateLimitDB'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY?.trim() || '')

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 1 comparison per 24 hours (superuser is exempt)
  const rateLimit = await checkComparisonRateLimit(supabase, user.id, user.email)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }

  const { urlA, urlB } = await request.json()
  if (!urlA || !urlB) return NextResponse.json({ error: 'Two URLs required' }, { status: 400 })

  try {
    // Run both audits in parallel
    const [dataA, dataB] = await Promise.all([
      scrapePage(urlA),
      scrapePage(urlB),
    ])

    const [aiA, aiB] = await Promise.all([
      analyzeLandingPage(dataA),
      analyzeLandingPage(dataB),
    ])

    const seoA = checkSEO(dataA.html || '')
    const seoB = checkSEO(dataB.html || '')

    const scoresA = calculateFinalScores(aiA, seoA)
    const scoresB = calculateFinalScores(aiB, seoB)

    // AI comparison summary
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const comparisonPrompt = `
Compare these two landing page audits and explain which one is better for conversion:

Site A (${urlA}): Overall ${scoresA.overallScore}, SEO ${scoresA.seoScore}, Copy ${scoresA.copywritingScore}, Trust ${scoresA.trustScore}
Site B (${urlB}): Overall ${scoresB.overallScore}, SEO ${scoresB.seoScore}, Copy ${scoresB.copywritingScore}, Trust ${scoresB.trustScore}

Return JSON only: { "winner": "A" or "B" or "tie", "summary": "2-3 sentences explaining why", "keyDifferences": ["diff1", "diff2", "diff3"] }
`
    const compResult = await model.generateContent(comparisonPrompt)
    const compText = compResult.response.text().replace(/```json|```/g, '').trim()
    let comparison_ai
    try {
      comparison_ai = JSON.parse(compText)
    } catch {
      comparison_ai = { winner: 'tie', summary: 'Could not determine a clear winner.', keyDifferences: [] }
    }

    const comparison = [
      { category: 'Overall', scoreA: scoresA.overallScore, scoreB: scoresB.overallScore },
      { category: 'SEO', scoreA: scoresA.seoScore, scoreB: scoresB.seoScore },
      { category: 'Copywriting', scoreA: scoresA.copywritingScore, scoreB: scoresB.copywritingScore },
      { category: 'Trust Signals', scoreA: scoresA.trustScore, scoreB: scoresB.trustScore },
      { category: 'UX', scoreA: scoresA.uxScore, scoreB: scoresB.uxScore },
    ]

    // Save to database
    const { data: dbResult, error: dbError } = await supabase
      .from('comparisons')
      .insert({
        user_id: user.id,
        url_a: urlA,
        url_b: urlB,
        winner: comparison_ai.winner,
        summary: comparison_ai.summary,
        key_differences: comparison_ai.keyDifferences,
        comparison_data: comparison,
      })
      .select('id')
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
      throw new Error(dbError.message || 'Database insert failed')
    }

    return NextResponse.json({
      id: dbResult?.id,
      winner: comparison_ai.winner,
      summary: comparison_ai.summary,
      keyDifferences: comparison_ai.keyDifferences,
      comparison,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Comparison failed' },
      { status: 500 }
    )
  }
}

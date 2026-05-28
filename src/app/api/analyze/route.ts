import { NextResponse } from 'next/server'
import { analyzeLandingPage } from '@/lib/aiAnalyzer'
import { createServerClient } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rateLimitDB'
import { checkSEO } from '@/lib/seoChecker'
import { calculateFinalScores } from '@/lib/scorer'

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(user)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: rateLimit.error,
        isLimitReached: true 
      }, { status: 429 })
    }

    const { scrapedData } = await request.json()

    if (!scrapedData) {
      return NextResponse.json({ error: 'No data to analyze' }, { status: 400 })
    }

    // Run deterministic SEO check
    const seoResult = checkSEO(scrapedData.html || '')

    // Run AI analysis
    const aiAnalysis = await analyzeLandingPage(scrapedData)

    // Combine and apply fixed weights
    const analysis = calculateFinalScores(aiAnalysis, seoResult)

    // Save report to database
    const { data: report, error: saveError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        url: scrapedData.url,
        overall_score: analysis.overallScore,
        seo_score: analysis.seoScore,
        ux_score: analysis.uxScore,
        copywriting_score: analysis.copywritingScore,
        trust_signals_score: analysis.trustScore,
        screenshot_url: scrapedData.screenshotUrl || null,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save report:', saveError)
      throw new Error(`Database Error: ${saveError.message}`)
    }

    // Save findings
    if (report && analysis.findings.length > 0) {
      const findingsToInsert = analysis.findings.map((finding) => ({
        report_id: report.id,
        issue_type: finding.category,
        severity: finding.severity,
        suggestion: `${finding.issue} - ${finding.suggestion}`,
        element: finding.impact,
      }))

      await supabase.from('findings').insert(findingsToInsert)
    }

    return NextResponse.json({
      analysis,
      reportId: report?.id,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
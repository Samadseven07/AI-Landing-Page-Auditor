import { NextResponse } from 'next/server'
import { analyzeLandingPage } from '@/lib/aiAnalyzer'
import { createServerClient } from '@/lib/supabaseServer'

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
    const SUPER_USER = 'abdulsamadchishti07@gmail.com'
    const LIMIT = 3
    const WINDOW_HOURS = 24

    if (user.email !== SUPER_USER) {
      const twentyFourHoursAgo = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
      
      const { count, error: countError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo)

      if (countError) {
        console.error('Rate limit check failed:', countError)
      } else if (count !== null && count >= LIMIT) {
        return NextResponse.json({ 
          error: `Audit limit reached. You can perform ${LIMIT} audits every ${WINDOW_HOURS} hours. Your limit will reset soon.`,
          isLimitReached: true 
        }, { status: 429 })
      }
    }

    const { scrapedData } = await request.json()

    if (!scrapedData) {
      return NextResponse.json({ error: 'No data to analyze' }, { status: 400 })
    }

    // Run AI analysis
    const analysis = await analyzeLandingPage(scrapedData)

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
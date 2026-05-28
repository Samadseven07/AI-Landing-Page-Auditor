import { NextResponse } from 'next/server'
import { scrapePage } from '@/lib/scraper'
import { createServerClient } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rateLimitDB'
import { runSeoChecks } from '@/lib/seoChecker'

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

    const { url } = await request.json()

    // Validate URL
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid URL required' }, { status: 400 })
    }

    // Run scraper
    const data = await scrapePage(url)
    // Run deterministic SEO checks
    const seoResult = runSeoChecks(data.html || '', url)

    // Upload screenshot to Supabase Storage (optional for MVP)
    let screenshotUrl: string | null = null
    if (data.screenshot) {
      const fileName = `screenshots/${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase
        .storage
        .from('screenshots')
        .upload(fileName, data.screenshot, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase
          .storage
          .from('screenshots')
          .getPublicUrl(fileName)
        screenshotUrl = publicUrl
      }
    }

    // Upload mobile screenshot
    let mobileScreenshotUrl: string | null = null
    if (data.mobileScreenshot) {
      const mobileFileName = `screenshots/${user.id}/${Date.now()}-mobile.jpg`
      const { error: mobileUploadError } = await supabase
        .storage
        .from('screenshots')
        .upload(mobileFileName, data.mobileScreenshot, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (!mobileUploadError) {
        const { data: { publicUrl } } = supabase
          .storage
          .from('screenshots')
          .getPublicUrl(mobileFileName)
        mobileScreenshotUrl = publicUrl
      }
    }

    // Return structured data (exclude buffers for response)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { screenshot, mobileScreenshot, ...safeData } = data
    
    return NextResponse.json({
      ...safeData,
      seoResult,
      screenshotUrl,
      mobileScreenshotUrl,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('API scrape error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping failed' },
      { status: 500 }
    )
  }
}
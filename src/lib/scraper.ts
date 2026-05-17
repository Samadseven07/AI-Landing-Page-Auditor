import { chromium, Browser, Page } from 'playwright'
import * as cheerio from 'cheerio'

export interface ScrapedData {
  url: string
  title: string
  metaDescription: string
  h1: string[]
  h2: string[]
  buttons: Array<{ text: string; href?: string }>
  visibleText: string
  html: string
  screenshot: Buffer | null
  loadTime: number
}

export async function scrapePage(url: string): Promise<ScrapedData> {
  let browser: Browser | null = null
  let page: Page | null = null
  const startTime = Date.now()

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })

    // Set timeout and navigate
    await page.goto(url, { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    })

    // Extract HTML content
    const html = await page.content()
    const $ = cheerio.load(html)

    // Extract metadata
    const title = $('title').text().trim() || $('h1').first().text().trim()
    const metaDescription = $('meta[name="description"]').attr('content') || ''

    // Extract headings
    const h1 = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean)
    const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean)

    // Extract buttons/CTAs
    const buttons = $('button, a[class*="btn"], a[class*="button"], [role="button"]')
      .map((_, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr('href'),
      }))
      .get()
      .filter(btn => btn.text.length > 0)

    // Extract visible text (simplified - remove scripts/styles)
    $('script, style, nav, footer').remove()
    const visibleText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000)

    // Take screenshot for vision analysis
    let screenshot: Buffer | null = null
    try {
      screenshot = await page.screenshot({ 
        type: 'jpeg', 
        quality: 80, 
        fullPage: false 
      })
    } catch (err) {
      console.warn('Screenshot failed:', err)
    }

    const loadTime = Date.now() - startTime

    return {
      url,
      title,
      metaDescription,
      h1,
      h2,
      buttons,
      visibleText,
      html,
      screenshot,
      loadTime,
    }

  } catch (error) {
    console.error('Scraping error:', error)
    throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    if (page) await page.close()
    if (browser) await browser.close()
  }
}
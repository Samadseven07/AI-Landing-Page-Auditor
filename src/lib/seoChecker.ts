import * as cheerio from 'cheerio'


export interface SEOCheckResult {
  score: number
  checks: {
    title: { passed: boolean; message: string; score: number }
    description: { passed: boolean; message: string; score: number }
    h1: { passed: boolean; message: string; score: number }
    images: { passed: boolean; message: string; score: number }
    canonical: { passed: boolean; message: string; score: number }
    ogTags: { passed: boolean; message: string; score: number }
    viewport: { passed: boolean; message: string; score: number }
    hierarchy: { passed: boolean; message: string; score: number }
  }
}

export function checkSEO(html: string): SEOCheckResult {
  const $ = cheerio.load(html)
  let totalScore = 0

  // 1. Title Tag (15 points)
  const title = $('title').text().trim()
  let titleScore = 0
  let titleMessage = 'Title tag is missing or empty.'
  if (title) {
    if (title.length >= 30 && title.length <= 65) {
      titleScore = 15
      titleMessage = 'Title tag is present and has optimal length.'
    } else {
      titleScore = 7
      titleMessage = `Title tag length (${title.length}) is sub-optimal (aim for 30-65 chars).`
    }
  }

  // 2. Meta Description (15 points)
  const description = $('meta[name="description"]').attr('content')?.trim()
  let descScore = 0
  let descMessage = 'Meta description is missing.'
  if (description) {
    if (description.length >= 120 && description.length <= 165) {
      descScore = 15
      descMessage = 'Meta description is present and optimal.'
    } else {
      descScore = 7
      descMessage = `Meta description length (${description.length}) is sub-optimal (aim for 120-165 chars).`
    }
  }

  // 3. H1 Tag (15 points)
  const h1s = $('h1')
  let h1Score = 0
  let h1Message = 'No H1 tag found.'
  if (h1s.length === 1) {
    h1Score = 15
    h1Message = 'Exactly one H1 tag found.'
  } else if (h1s.length > 1) {
    h1Score = 5
    h1Message = `Found ${h1s.length} H1 tags. Best practice is exactly one.`
  }

  // 4. Image Alt Tags (15 points)
  const images = $('img')
  const imagesWithAlt = images.filter((_, el) => !!$(el).attr('alt')?.trim())
  let imgScore = 15
  let imgMessage = 'No images found to check.'
  if (images.length > 0) {
    const ratio = imagesWithAlt.length / images.length
    imgScore = Math.round(ratio * 15)
    imgMessage = `${imagesWithAlt.length} out of ${images.length} images have alt attributes.`
  }

  // 5. Canonical Tag (10 points)
  const canonical = $('link[rel="canonical"]').attr('href')
  const canonicalScore = canonical ? 10 : 0
  const canonicalMessage = canonical ? 'Canonical tag is present.' : 'Canonical tag is missing.'

  // 6. Open Graph Tags (10 points)
  const ogTitle = $('meta[property="og:title"]').attr('content')
  const ogDesc = $('meta[property="og:description"]').attr('content')
  const ogImage = $('meta[property="og:image"]').attr('content')
  let ogScore = 0
  if (ogTitle && ogDesc && ogImage) ogScore = 10
  else if (ogTitle || ogDesc || ogImage) ogScore = 5
  const ogMessage = ogScore === 10 ? 'Essential OG tags are present.' : (ogScore === 5 ? 'Some OG tags are missing.' : 'No Open Graph tags found.')

  // 7. Viewport Tag (10 points)
  const viewport = $('meta[name="viewport"]').attr('content')
  const viewportScore = viewport ? 10 : 0
  const viewportMessage = viewport ? 'Viewport meta tag is present.' : 'Viewport meta tag is missing.'

  // 8. Heading Hierarchy (10 points)
  let hierarchyScore = 10
  let hierarchyMessage = 'Heading hierarchy is logical.'
  const headings = $('h1, h2, h3, h4, h5, h6')
  let previousLevel = 0
  headings.each((_, el) => {
    const level = parseInt(el.tagName.replace('h', ''))
    if (previousLevel !== 0 && level - previousLevel > 1) {
      hierarchyScore = 0
      hierarchyMessage = `Skipped heading level from H${previousLevel} to H${level}.`
      return false // break loop
    }
    previousLevel = level
  })

  totalScore = titleScore + descScore + h1Score + imgScore + canonicalScore + ogScore + viewportScore + hierarchyScore

  return {
    score: totalScore,
    checks: {
      title: { passed: titleScore === 15, message: titleMessage, score: titleScore },
      description: { passed: descScore === 15, message: descMessage, score: descScore },
      h1: { passed: h1Score === 15, message: h1Message, score: h1Score },
      images: { passed: imgScore === 15, message: imgMessage, score: imgScore },
      canonical: { passed: canonicalScore === 10, message: canonicalMessage, score: canonicalScore },
      ogTags: { passed: ogScore === 10, message: ogMessage, score: ogScore },
      viewport: { passed: viewportScore === 10, message: viewportMessage, score: viewportScore },
      hierarchy: { passed: hierarchyScore === 10, message: hierarchyMessage, score: hierarchyScore },
    }
  }
}



export interface SeoFinding {
  id: string
  label: string
  passed: boolean
  severity: 'critical' | 'warning' | 'info'
  detail: string
  penalty: number
}

export interface SeoResult {
  score: number
  findings: SeoFinding[]
}

export function runSeoChecks(html: string, url: string): SeoResult {
  const $ = cheerio.load(html)
  const findings: SeoFinding[] = []

  // ── 1. Title tag ──────────────────────────────────────────
  const title = $('title').text().trim()
  if (!title) {
    findings.push({
      id: 'title-missing',
      label: 'Title tag missing',
      passed: false,
      severity: 'critical',
      detail: 'Page has no <title> tag. This is the most important on-page SEO element.',
      penalty: 20,
    })
  } else if (title.length < 30) {
    findings.push({
      id: 'title-short',
      label: 'Title tag too short',
      passed: false,
      severity: 'warning',
      detail: `Title is only ${title.length} characters. Aim for 50–60 characters.`,
      penalty: 8,
    })
  } else if (title.length > 60) {
    findings.push({
      id: 'title-long',
      label: 'Title tag too long',
      passed: false,
      severity: 'warning',
      detail: `Title is ${title.length} characters. Google truncates titles over 60 characters.`,
      penalty: 5,
    })
  } else {
    findings.push({
      id: 'title-ok',
      label: 'Title tag is well-optimized',
      passed: true,
      severity: 'info',
      detail: `Title is ${title.length} characters — within the ideal 50–60 range.`,
      penalty: 0,
    })
  }

  // ── 2. Meta description ───────────────────────────────────
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() || ''
  if (!metaDesc) {
    findings.push({
      id: 'meta-desc-missing',
      label: 'Meta description missing',
      passed: false,
      severity: 'critical',
      detail: 'No meta description found. This directly impacts click-through rate from search results.',
      penalty: 15,
    })
  } else if (metaDesc.length < 100) {
    findings.push({
      id: 'meta-desc-short',
      label: 'Meta description too short',
      passed: false,
      severity: 'warning',
      detail: `Meta description is ${metaDesc.length} characters. Aim for 150–160.`,
      penalty: 6,
    })
  } else if (metaDesc.length > 160) {
    findings.push({
      id: 'meta-desc-long',
      label: 'Meta description too long',
      passed: false,
      severity: 'warning',
      detail: `Meta description is ${metaDesc.length} characters. Google cuts off after ~160.`,
      penalty: 4,
    })
  } else {
    findings.push({
      id: 'meta-desc-ok',
      label: 'Meta description is well-optimized',
      passed: true,
      severity: 'info',
      detail: `Meta description is ${metaDesc.length} characters — ideal range.`,
      penalty: 0,
    })
  }

  // ── 3. H1 tag ─────────────────────────────────────────────
  const h1Tags = $('h1')
  if (h1Tags.length === 0) {
    findings.push({
      id: 'h1-missing',
      label: 'H1 heading missing',
      passed: false,
      severity: 'critical',
      detail: 'No H1 tag found. Every page needs exactly one H1 for SEO structure.',
      penalty: 15,
    })
  } else if (h1Tags.length > 1) {
    findings.push({
      id: 'h1-multiple',
      label: 'Multiple H1 tags found',
      passed: false,
      severity: 'warning',
      detail: `Found ${h1Tags.length} H1 tags. Pages should have exactly one H1.`,
      penalty: 8,
    })
  } else {
    findings.push({
      id: 'h1-ok',
      label: 'Single H1 heading present',
      passed: true,
      severity: 'info',
      detail: `H1: "${h1Tags.first().text().trim().slice(0, 60)}"`,
      penalty: 0,
    })
  }

  // ── 4. Image alt tags ─────────────────────────────────────
  const images = $('img')
  const imagesWithoutAlt: string[] = []
  images.each((_, el) => {
    const alt = $(el).attr('alt')
    if (!alt || alt.trim() === '') {
      const src = $(el).attr('src') || 'unknown'
      imagesWithoutAlt.push(src.split('/').pop() || src)
    }
  })

  if (images.length === 0) {
    findings.push({
      id: 'images-none',
      label: 'No images found',
      passed: false,
      severity: 'info',
      detail: 'Landing pages with relevant images typically convert better. Consider adding visuals.',
      penalty: 3,
    })
  } else if (imagesWithoutAlt.length > 0) {
    findings.push({
      id: 'alt-missing',
      label: `${imagesWithoutAlt.length} image(s) missing alt text`,
      passed: false,
      severity: imagesWithoutAlt.length > 3 ? 'critical' : 'warning',
      detail: `Missing alt: ${imagesWithoutAlt.slice(0, 3).join(', ')}${imagesWithoutAlt.length > 3 ? '...' : ''}. Alt text is required for accessibility and image SEO.`,
      penalty: Math.min(imagesWithoutAlt.length * 2, 12),
    })
  } else {
    findings.push({
      id: 'alt-ok',
      label: 'All images have alt text',
      passed: true,
      severity: 'info',
      detail: `All ${images.length} images have alt attributes.`,
      penalty: 0,
    })
  }

  // ── 5. Canonical tag ──────────────────────────────────────
  const canonical = $('link[rel="canonical"]').attr('href')
  if (!canonical) {
    findings.push({
      id: 'canonical-missing',
      label: 'Canonical tag missing',
      passed: false,
      severity: 'warning',
      detail: 'No canonical tag found. Add <link rel="canonical" href="..."> to prevent duplicate content issues.',
      penalty: 7,
    })
  } else {
    findings.push({
      id: 'canonical-ok',
      label: 'Canonical tag present',
      passed: true,
      severity: 'info',
      detail: `Canonical points to: ${canonical}`,
      penalty: 0,
    })
  }

  // ── 6. Open Graph tags ────────────────────────────────────
  const ogTitle = $('meta[property="og:title"]').attr('content')
  const ogDesc = $('meta[property="og:description"]').attr('content')
  const ogImage = $('meta[property="og:image"]').attr('content')

  const missingOG = []
  if (!ogTitle) missingOG.push('og:title')
  if (!ogDesc) missingOG.push('og:description')
  if (!ogImage) missingOG.push('og:image')

  if (missingOG.length > 0) {
    findings.push({
      id: 'og-missing',
      label: `Missing Open Graph tags: ${missingOG.join(', ')}`,
      passed: false,
      severity: 'warning',
      detail: 'Open Graph tags control how your page looks when shared on LinkedIn, Twitter, Facebook.',
      penalty: missingOG.length * 3,
    })
  } else {
    findings.push({
      id: 'og-ok',
      label: 'Open Graph tags complete',
      passed: true,
      severity: 'info',
      detail: 'og:title, og:description, and og:image are all present.',
      penalty: 0,
    })
  }

  // ── 7. Viewport meta ─────────────────────────────────────
  const viewport = $('meta[name="viewport"]').attr('content')
  if (!viewport) {
    findings.push({
      id: 'viewport-missing',
      label: 'Viewport meta tag missing',
      passed: false,
      severity: 'critical',
      detail: 'No viewport meta tag. Mobile users will see a zoomed-out desktop layout.',
      penalty: 15,
    })
  } else {
    findings.push({
      id: 'viewport-ok',
      label: 'Viewport meta tag present',
      passed: true,
      severity: 'info',
      detail: `Viewport: "${viewport}"`,
      penalty: 0,
    })
  }

  // ── 8. Heading hierarchy ──────────────────────────────────
  const hasH2 = $('h2').length > 0
  if (!hasH2) {
    findings.push({
      id: 'h2-missing',
      label: 'No H2 headings found',
      passed: false,
      severity: 'warning',
      detail: 'No H2 tags found. Good heading structure helps both SEO and readability.',
      penalty: 5,
    })
  } else {
    findings.push({
      id: 'h2-ok',
      label: `${$('h2').length} H2 heading(s) found`,
      passed: true,
      severity: 'info',
      detail: 'Page has a proper heading hierarchy.',
      penalty: 0,
    })
  }

  // ── Calculate score ───────────────────────────────────────
  const totalPenalty = findings.reduce((sum, f) => sum + f.penalty, 0)
  const score = Math.max(0, Math.min(100, 100 - totalPenalty))

  return { score, findings }
}
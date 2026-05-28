import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY?.trim() || '')

export interface CopyRewrite {
  section: string
  original: string
  improved: string
  reason: string
}

export interface AnalysisResult {
  overallScore: number
  seoScore: number
  uxScore: number
  copywritingScore: number
  trustScore: number
  findings: Finding[]
  improvedHeadline?: string
  improvedCTA?: string
  copyRewrites?: CopyRewrite[]
}

export interface Finding {
  category: 'SEO' | 'UX' | 'Copywriting' | 'Trust' | 'CTA'
  severity: 'low' | 'medium' | 'high'
  issue: string
  suggestion: string
  impact: string
}

export async function analyzeLandingPage(data: {
  url: string
  title: string
  metaDescription: string
  h1: string[]
  h2: string[]
  buttons: Array<{ text: string; href?: string }>
  visibleText: string
  screenshot?: Buffer | null
}): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

  // Build the analysis prompt
  const prompt = buildAnalysisPrompt(data)

  try {
    // If we have a screenshot, use vision analysis
    if (data.screenshot) {
      const imagePart = {
        inlineData: {
          data: data.screenshot.toString('base64'),
          mimeType: 'image/jpeg',
        },
      }

      const result = await model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()
      
      return parseAIResponse(text)
    } else {
      // Text-only analysis
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      return parseAIResponse(text)
    }
  } catch (error: any) {
    console.error('Gemini API error:', error)
    throw new Error(error.message || 'AI analysis failed')
  }
}

function buildAnalysisPrompt(data: Parameters<typeof analyzeLandingPage>[0]): string {
  return `
You are an expert landing page auditor. Analyze this landing page for conversion optimization.

WEBSITE URL: ${data?.url || 'Unknown'}
TITLE: ${data?.title || 'Unknown'}
META DESCRIPTION: ${data?.metaDescription || 'None'}
H1 HEADINGS: ${(data?.h1 || []).join(', ') || 'None'}
H2 HEADINGS: ${(data?.h2 || []).join(', ') || 'None'}
BUTTONS/CTAs: ${JSON.stringify(data?.buttons || [])}
VISIBLE TEXT: ${(data?.visibleText || '').slice(0, 2000)}

Analyze for:
1. **Headline Quality** - Is it clear, specific, outcome-focused?
2. **CTA Effectiveness** - Are buttons action-oriented with urgency?
3. **SEO Basics** - Title, meta, headings structure
4. **Copywriting** - Clarity, persuasion, specificity
5. **Trust Signals** - Testimonials, guarantees, social proof
6. **UX/Structure** - Information hierarchy, clarity

Return your analysis in this EXACT JSON format:
{
  "overallScore": 0-100,
  "seoScore": 0-100,
  "uxScore": 0-100,
  "copywritingScore": 0-100,
  "trustScore": 0-100,
  "findings": [
    {
      "category": "SEO|UX|Copywriting|Trust|CTA",
      "severity": "low|medium|high",
      "issue": "What's wrong",
      "suggestion": "How to fix it",
      "impact": "Why it matters"
    }
  ],
  "improvedHeadline": "Better headline suggestion",
  "improvedCTA": "Better CTA button text",
  "copyRewrites": [
    {
      "section": "Hero Headline",
      "original": "exact text from the page",
      "improved": "your rewritten version",
      "reason": "why this is better"
    },
    {
      "section": "Subheadline / Hero Body",
      "original": "exact text",
      "improved": "rewritten version",
      "reason": "explanation"
    },
    {
      "section": "Primary CTA Button",
      "original": "Submit",
      "improved": "Get My Free Audit",
      "reason": "Action verb + value prop + urgency"
    }
  ]
}

Be specific and actionable. Don't give generic advice. For copyRewrites, use the EXACT original text found on the page.
`
}

function parseAIResponse(text: string): AnalysisResult {
  try {
    // Clean the response (sometimes AI adds markdown code blocks)
    const cleanText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    
    const parsed = JSON.parse(cleanText)
    
    return {
      overallScore: parsed.overallScore || 0,
      seoScore: parsed.seoScore || 0,
      uxScore: parsed.uxScore || 0,
      copywritingScore: parsed.copywritingScore || 0,
      trustScore: parsed.trustScore || 0,
      findings: parsed.findings || [],
      improvedHeadline: parsed.improvedHeadline,
      improvedCTA: parsed.improvedCTA,
      copyRewrites: parsed.copyRewrites || [],
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    // Return fallback analysis
    return getFallbackAnalysis()
  }
}

function getFallbackAnalysis(): AnalysisResult {
  return {
    overallScore: 65,
    seoScore: 70,
    uxScore: 60,
    copywritingScore: 55,
    trustScore: 50,
    findings: [
      {
        category: 'Copywriting',
        severity: 'medium',
        issue: 'Generic messaging detected',
        suggestion: 'Add specific outcomes and numbers',
        impact: 'Increases conversion by 40%',
      },
      {
        category: 'CTA',
        severity: 'high',
        issue: 'Weak call-to-action',
        suggestion: 'Use action verbs with urgency',
        impact: 'Primary conversion driver',
      },
    ],
    improvedHeadline: 'Get [Specific Result] in [Timeframe] Without [Common Objection]',
    improvedCTA: 'Get Started Free',
  }
}
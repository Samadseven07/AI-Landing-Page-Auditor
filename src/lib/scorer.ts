import { AnalysisResult } from './aiAnalyzer'
import { SEOCheckResult } from './seoChecker'

export function calculateFinalScores(aiResult: AnalysisResult, seoResult: SEOCheckResult): AnalysisResult {
  // Weights for the overall score
  const SEO_WEIGHT = 0.35 // 35%
  const UX_WEIGHT = 0.25 // 25%
  const COPY_WEIGHT = 0.25 // 25%
  const TRUST_WEIGHT = 0.15 // 15%

  // Use the deterministic SEO score
  const finalSeoScore = seoResult.score

  // Keep AI scores for UX, Copywriting, and Trust, but normalize them to ensure consistency
  // (You could apply additional deterministic checks for these if you had them, 
  // but for now we use the AI's scores constrained to 0-100)
  const finalUxScore = Math.max(0, Math.min(100, aiResult.uxScore))
  const finalCopyScore = Math.max(0, Math.min(100, aiResult.copywritingScore))
  const finalTrustScore = Math.max(0, Math.min(100, aiResult.trustScore))

  // Calculate weighted overall score
  const rawOverall = 
    (finalSeoScore * SEO_WEIGHT) + 
    (finalUxScore * UX_WEIGHT) + 
    (finalCopyScore * COPY_WEIGHT) + 
    (finalTrustScore * TRUST_WEIGHT)

  const finalOverallScore = Math.round(rawOverall)

  // Append deterministic SEO findings to the AI findings
  const combinedFindings = [...aiResult.findings]

  Object.entries(seoResult.checks).forEach(([key, check]) => {
    if (!check.passed) {
      combinedFindings.push({
        category: 'SEO',
        severity: check.score === 0 ? 'high' : 'medium',
        issue: check.message,
        suggestion: `Fix the ${key} tag to align with SEO best practices.`,
        impact: 'Affects search engine ranking and visibility.'
      })
    }
  })

  return {
    ...aiResult,
    overallScore: finalOverallScore,
    seoScore: finalSeoScore,
    uxScore: finalUxScore,
    copywritingScore: finalCopyScore,
    trustScore: finalTrustScore,
    findings: combinedFindings
  }
}

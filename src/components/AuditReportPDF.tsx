import React from 'react'
import { Document, Page, Text, View, StyleSheet, Svg, Circle } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { 
    padding: 0, 
    fontFamily: 'Helvetica',
    backgroundColor: '#FAFAFA'
  },
  headerBanner: {
    backgroundColor: '#09090b', // zinc-950
    padding: 40,
    paddingTop: 50,
  },
  headerSubtitle: {
    color: '#a1a1aa', // zinc-400
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  headerUrl: {
    fontSize: 14,
    color: '#c084fc', // purple-400
  },
  contentContainer: {
    padding: 40,
    paddingBottom: 80,
  },
  mainScoreSection: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  scoreChartContainer: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f4f4f5',
    paddingRight: 24,
    marginRight: 24,
  },
  overallText: {
    fontSize: 10,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    fontWeight: 'bold',
  },
  scoreDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    width: 90,
    fontSize: 10,
    color: '#52525b', // zinc-600
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#f4f4f5', // zinc-100
    borderRadius: 3,
    marginRight: 12,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  scoreValueText: {
    width: 25,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#18181b',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#18181b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 8,
  },
  findingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  findingCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderTopWidth: 4,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  findingCategory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 8,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  findingIssue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 8,
    lineHeight: 1.4,
  },
  findingSuggestion: {
    fontSize: 10,
    color: '#52525b',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#09090b',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  footerText: {
    color: '#a1a1aa',
    fontSize: 8,
    letterSpacing: 1,
  }
})

interface Finding {
  category: string
  severity: 'low' | 'medium' | 'high'
  issue: string
  suggestion: string
}

interface ReportData {
  url: string
  overall_score: number
  seo_score: number
  ux_score: number
  copywriting_score: number
  trust_signals_score: number
  findings: Finding[]
  created_at: string
}

const DonutChart = ({ score }: { score: number }) => {
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <View style={{ width: 90, height: 90, position: 'relative' }}>
      <Svg viewBox="0 0 100 100" width={90} height={90}>
        <Circle cx={50} cy={50} r={radius} stroke="#f4f4f5" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={50}
          cy={50}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          // @ts-ignore - react-pdf types are missing strokeDashoffset but it works
          strokeDashoffset={strokeDashoffset.toString()}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#18181b' }}>{score}</Text>
      </View>
    </View>
  )
}

const ScoreBar = ({ label, score }: { label: string; score: number }) => {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.progressBarBg}>
        <View style={{ ...styles.progressBarFill, width: `${score}%`, backgroundColor: color }} />
      </View>
      <Text style={styles.scoreValueText}>{score}</Text>
    </View>
  )
}

export const AuditReportPDF = ({ data }: { data: ReportData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={styles.headerSubtitle}>Intelligence Report</Text>
            <Text style={styles.headerTitle}>Landing Page Audit</Text>
            <Text style={styles.headerUrl}>{data.url}</Text>
          </View>
          <View>
            <Text style={{ color: '#71717a', fontSize: 10, textAlign: 'right' }}>
              {new Date(data.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Performance Metrics */}
        <View style={styles.mainScoreSection}>
          <View style={styles.scoreChartContainer}>
            <DonutChart score={data.overall_score} />
            <Text style={styles.overallText}>Overall Score</Text>
          </View>
          <View style={styles.scoreDetailsContainer}>
            <ScoreBar label="SEO Health" score={data.seo_score} />
            <ScoreBar label="UX & Design" score={data.ux_score} />
            <ScoreBar label="Copywriting" score={data.copywriting_score} />
            <ScoreBar label="Trust Signals" score={data.trust_signals_score} />
          </View>
        </View>

        {/* Findings Grid */}
        <Text style={styles.sectionTitle}>Critical Findings & Roadmap</Text>
        <View style={styles.findingsGrid}>
          {data.findings.slice(0, 8).map((finding, index) => {
            const severityColor = finding.severity === 'high' ? '#ef4444' : finding.severity === 'medium' ? '#f59e0b' : '#3b82f6';
            const severityBg = finding.severity === 'high' ? '#fef2f2' : finding.severity === 'medium' ? '#fffbeb' : '#eff6ff';
            
            return (
              <View key={index} style={[styles.findingCard, { borderTopColor: severityColor }]} wrap={false}>
                <View style={styles.findingCategory}>
                  <Text style={styles.categoryText}>{finding.category}</Text>
                  <Text style={[styles.severityBadge, { color: severityColor, backgroundColor: severityBg }]}>
                    {finding.severity}
                  </Text>
                </View>
                <Text style={styles.findingIssue}>{finding.issue}</Text>
                <Text style={styles.findingSuggestion}>{finding.suggestion}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>GENERATED BY AI LANDING PAGE AUDITOR</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `PAGE ${pageNumber} OF ${totalPages}`} />
      </View>

    </Page>
  </Document>
)
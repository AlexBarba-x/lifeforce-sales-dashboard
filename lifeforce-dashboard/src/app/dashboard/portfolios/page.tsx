'use client'

import { useEffect, useState } from 'react'
import { COLORS, TYPE, TYPE_SCALE, formatMoney } from '@/lib/design'

// ── Types ────────────────────────────────────────────────────────────────

interface InsuredData {
  first_name: string | null
  last_name: string | null
  dob: string | null
  gender: string | null
  health_status: string | null
  primary_medical_condition: string | null
  is_anonymous: boolean
  anonymous_alias: string | null
}

interface PolicyRow {
  id: string
  policy_number: string | null
  carrier: string | null
  death_benefit: number | null
  policy_type: string | null
  issue_date: string | null
  annual_premium: number | null
  stage: string | null
  insured: InsuredData
}

interface Portfolio {
  id: string
  name: string
  display_name: string
  tape_date: string | null
  policy_count: number
  total_face: number
  notes: string | null
  policies: PolicyRow[]
}

// ── Helpers ───────────────────────────────────────────────────────────────

function insuredName(insured: InsuredData): string {
  if (insured.is_anonymous) return insured.anonymous_alias ?? '—'
  const last = insured.last_name?.trim()
  const first = insured.first_name?.trim()
  if (last && first) return `${last}, ${first}`
  if (last) return last
  if (first) return first
  return '—'
}

function normalizeType(type: string | null): string {
  if (!type) return '—'
  const t = type.toLowerCase()
  if (t.includes('universal') || t.includes(' ul') || t === 'ul') return 'UL'
  if (t.includes('term')) return 'Term'
  if (t.includes('whole') || t.includes(' wl') || t === 'wl') return 'WL'
  if (t.includes('variable') || t.includes(' vul') || t === 'vul') return 'VUL'
  if (t.includes('survivorship') || t.includes('sur')) return 'SUL'
  // Abbreviate long strings
  if (type.length > 10) return type.slice(0, 8) + '…'
  return type
}

function issueYear(iso: string | null): string {
  if (!iso) return '—'
  return String(new Date(iso).getUTCFullYear())
}

function formatTapeDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function formatFaceCompact(amount: number | null): string {
  if (!amount) return '—'
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

// Stage pill colors (same palette as Cases table)
const STAGE_BADGE: Record<string, { bg: string; border: string }> = {
  intake:       { bg: '#E5DFD5', border: '#D6CFBF' },
  underwriting: { bg: '#C5D4CA', border: '#AABFB3' },
  market:       { bg: '#F5F2EC', border: '#DDD8CE' },
  working:      { bg: '#D9CFB7', border: '#C8BC9E' },
  closing:      { bg: '#B8CCC0', border: '#9AB0A5' },
  closed:       { bg: '#E0DDD8', border: '#C8C4BE' },
}

function StagePill({ stage }: { stage: string | null }) {
  if (!stage) return <span style={{ color: COLORS.mutedGray }}>—</span>
  const key = stage.toLowerCase()
  const { bg, border } = STAGE_BADGE[key] ?? { bg: COLORS.parchmentDeep, border: COLORS.rule }
  const label = stage.charAt(0).toUpperCase() + stage.slice(1)
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 9px',
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderRadius: '3px',
      fontFamily: 'Sohne, sans-serif',
      fontSize: '11px',
      fontWeight: 600,
      color: COLORS.ink2,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

function PortfolioPoliciesTable({ policies }: { policies: PolicyRow[] }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(policies.length / PAGE_SIZE)
  const pageSlice = policies.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const COL_WIDTHS = '1fr 160px 80px 70px 60px 100px'

  return (
    <div>
      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: COL_WIDTHS,
        padding: '8px 18px',
        backgroundColor: COLORS.surfaceAlt,
        borderBottom: `1px solid ${COLORS.rule}`,
        gap: '12px',
        ...TYPE_SCALE.micro,
        fontFamily: 'Sohne, sans-serif',
        color: COLORS.warmGray,
      }}>
        <span>INSURED</span>
        <span>CARRIER</span>
        <span style={{ textAlign: 'right' }}>FACE</span>
        <span>TYPE</span>
        <span>ISSUED</span>
        <span>STATUS</span>
      </div>

      {/* Rows */}
      {pageSlice.map((policy, i) => (
        <div
          key={policy.id}
          style={{
            display: 'grid',
            gridTemplateColumns: COL_WIDTHS,
            padding: '10px 18px',
            gap: '12px',
            borderBottom: i < pageSlice.length - 1 ? `1px solid ${COLORS.rule}` : 'none',
            backgroundColor: COLORS.surface,
            alignItems: 'center',
            transition: 'background-color 120ms ease-out',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = COLORS.surface }}
        >
          {/* Insured */}
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            color: COLORS.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {insuredName(policy.insured)}
          </span>

          {/* Carrier */}
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '12px',
            color: COLORS.ink2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {policy.carrier ?? '—'}
          </span>

          {/* Face */}
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: COLORS.ink,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatFaceCompact(policy.death_benefit)}
          </span>

          {/* Type */}
          <span style={{
            display: 'inline-block',
            padding: '2px 7px',
            backgroundColor: COLORS.parchmentDeep,
            border: `1px solid ${COLORS.rule}`,
            borderRadius: '3px',
            fontFamily: 'Sohne, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            color: COLORS.warmGray,
            whiteSpace: 'nowrap',
          }}>
            {normalizeType(policy.policy_type)}
          </span>

          {/* Issue Year */}
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '12px',
            color: COLORS.warmGray,
          }}>
            {issueYear(policy.issue_date)}
          </span>

          {/* Status */}
          <StagePill stage={policy.stage} />
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderTop: `1px solid ${COLORS.rule}`,
          backgroundColor: COLORS.surfaceAlt,
        }}>
          <span style={{ ...TYPE.body, color: COLORS.warmGray, fontSize: '12px' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, policies.length)} of {policies.length} policies
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              style={{
                ...TYPE.label,
                padding: '5px 12px',
                backgroundColor: page === 0 ? COLORS.parchmentDeep : COLORS.surface,
                border: `1px solid ${COLORS.rule}`,
                borderRadius: '3px',
                color: page === 0 ? COLORS.mutedGray : COLORS.ink2,
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                fontSize: '11px',
              }}
            >
              ← Prev
            </button>
            <span style={{ ...TYPE.body, fontSize: '12px', color: COLORS.warmGray, alignSelf: 'center', padding: '0 6px' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              style={{
                ...TYPE.label,
                padding: '5px 12px',
                backgroundColor: page >= totalPages - 1 ? COLORS.parchmentDeep : COLORS.surface,
                border: `1px solid ${COLORS.rule}`,
                borderRadius: '3px',
                color: page >= totalPages - 1 ? COLORS.mutedGray : COLORS.ink2,
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: '11px',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Portfolio Card ────────────────────────────────────────────────────────

function PortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  const avgFace = portfolio.policy_count > 0
    ? portfolio.total_face / portfolio.policy_count
    : 0

  return (
    <div style={{
      backgroundColor: COLORS.surface,
      border: `1px solid ${COLORS.rule}`,
      borderRadius: '6px',
      overflow: 'hidden',
      marginBottom: '28px',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: `1px solid ${COLORS.rule}`,
        backgroundColor: COLORS.surfaceAlt,
      }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px' }}>
          <h2 style={{
            fontFamily: 'Canela, Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '22px',
            color: COLORS.brandGreen,
            margin: 0,
            lineHeight: 1.2,
          }}>
            {portfolio.display_name}
          </h2>
          <span style={{
            ...TYPE.label,
            fontSize: '9px',
            color: COLORS.mutedGray,
            letterSpacing: '0.08em',
          }}>
            {portfolio.name}
          </span>
        </div>

        {/* Tape date */}
        <div style={{ ...TYPE.body, fontSize: '12px', color: COLORS.warmGray, marginBottom: '16px' }}>
          Tape date: {formatTapeDate(portfolio.tape_date)}
        </div>

        {/* KPI row */}
        <div style={{
          display: 'flex',
          gap: '32px',
        }}>
          <div>
            <div style={{ ...TYPE.label, fontSize: '9px', color: COLORS.mutedGray, marginBottom: '3px' }}>
              POLICIES
            </div>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontSize: '22px',
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {portfolio.policy_count.toLocaleString()}
            </div>
          </div>

          <div style={{ width: '1px', backgroundColor: COLORS.rule, alignSelf: 'stretch' }} />

          <div>
            <div style={{ ...TYPE.label, fontSize: '9px', color: COLORS.mutedGray, marginBottom: '3px' }}>
              TOTAL FACE
            </div>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontSize: '22px',
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatMoney(portfolio.total_face)}
            </div>
          </div>

          <div style={{ width: '1px', backgroundColor: COLORS.rule, alignSelf: 'stretch' }} />

          <div>
            <div style={{ ...TYPE.label, fontSize: '9px', color: COLORS.mutedGray, marginBottom: '3px' }}>
              AVG FACE / POLICY
            </div>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontSize: '22px',
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatMoney(avgFace)}
            </div>
          </div>
        </div>
      </div>

      {/* Policy table */}
      {portfolio.policies.length > 0
        ? <PortfolioPoliciesTable policies={portfolio.policies} />
        : (
          <div style={{ padding: '32px', textAlign: 'center', ...TYPE.body, color: COLORS.mutedGray }}>
            No individual policy records available for this tape.
          </div>
        )
      }
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/portfolios')
      .then(r => r.json())
      .then((d: Portfolio[]) => {
        setPortfolios(d)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message ?? 'Failed to load portfolios')
        setLoading(false)
      })
  }, [])

  const totalFace = portfolios.reduce((s, p) => s + p.total_face, 0)
  const totalPolicies = portfolios.reduce((s, p) => s + p.policy_count, 0)

  return (
    <div>
      {/* Hero */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '20px',
        marginBottom: '24px',
      }}>
        <h1 style={{
          fontFamily: 'Sohne, sans-serif',
          ...TYPE_SCALE.h1,
          color: COLORS.ink,
          margin: 0,
        }}>
          Portfolios
        </h1>
        {!loading && !error && (
          <span style={{ ...TYPE.body, color: COLORS.warmGray }}>
            {portfolios.length} {portfolios.length === 1 ? 'portfolio' : 'portfolios'}
            {' · '}
            {totalPolicies.toLocaleString()} policies
            {' · '}
            {formatMoney(totalFace)} face
          </span>
        )}
      </div>

      {loading && (
        <p style={{ ...TYPE.body, color: COLORS.warmGray }}>Loading portfolios…</p>
      )}

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#FEF2F1',
          border: '1px solid #F4C4BE',
          borderRadius: '4px',
          ...TYPE.body,
          color: '#8B2818',
        }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && portfolios.length === 0 && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.rule}`,
          borderRadius: '6px',
          ...TYPE.body,
          color: COLORS.warmGray,
        }}>
          No portfolios found.
        </div>
      )}

      {!loading && !error && portfolios.map(portfolio => (
        <PortfolioCard key={portfolio.id} portfolio={portfolio} />
      ))}
    </div>
  )
}

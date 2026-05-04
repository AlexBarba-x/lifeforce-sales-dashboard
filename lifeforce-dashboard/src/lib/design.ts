/**
 * Lifeforce Financial — v2 design system tokens (TypeScript)
 *
 * Single source of truth for colors, urgency thresholds, time semantics,
 * and the CaseV2 enrichment shape. Imported by every dashboard view.
 *
 * Brand palette (parchment + sage) is preserved. Where data legibility
 * needed more contrast we kept parchment for chrome (header, sidebars,
 * column rails) and switched the data area to surface-white.
 */

// ── Brand & surface ──────────────────────────────────────────────────────
export const COLORS = {
  parchment: '#F5F3EF',
  parchmentDeep: '#EDEAE3',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF8F4',
  ink: '#1A1A1A',
  ink2: '#3A3A3A',
  warmGray: '#6B6B6B',
  mutedGray: '#9A9A9A',
  rule: '#E5E3DF',
  ruleStrong: '#D6D3CC',
  brandGreen: '#2D3D35',
  sage: '#6B8F71',
  sageLight: '#8FB5AB',

  // Semantic — used for status, urgency, deltas
  red: '#B83232',
  redSoft: '#F4E4E1',
  amber: '#B07830',
  amberSoft: '#F5EAD8',
  green: '#5B7B6F',
  greenSoft: '#E3EBE5',
  blue: '#4A6378',
  blueSoft: '#E2E8EE',
} as const

// ── Stage definitions ────────────────────────────────────────────────────
export const STAGES = [
  'intake',
  'underwriting',
  'market',
  'working',
  'closing',
  'closed',
] as const
export type Stage = typeof STAGES[number]

export const STAGE_META: Record<Stage, { label: string; short: string }> = {
  intake:       { label: 'Intake',       short: 'IN' },
  underwriting: { label: 'Underwriting', short: 'UW' },
  market:       { label: 'Market',       short: 'MK' },
  working:      { label: 'Working',      short: 'WK' },
  closing:      { label: 'Closing',      short: 'CL' },
  closed:       { label: 'Closed',       short: 'CD' },
}

// ── Urgency model ────────────────────────────────────────────────────────
// Single semantic axis applied to every case across every view.
// "Urgency" answers: how badly does this need attention right now?
export type Urgency = 'critical' | 'attention' | 'monitor' | 'ontrack'

export const URGENCY_META: Record<Urgency, {
  label: string
  short: string
  fg: string
  bg: string
  border: string
  rank: number
}> = {
  critical:  { label: 'Critical',     short: 'CRIT', fg: '#FFFFFF',          bg: COLORS.red,    border: COLORS.red,    rank: 0 },
  attention: { label: 'Attention',    short: 'ATTN', fg: COLORS.amber,       bg: COLORS.amberSoft, border: COLORS.amber,  rank: 1 },
  monitor:   { label: 'Monitor',      short: 'MON',  fg: COLORS.warmGray,    bg: COLORS.parchmentDeep, border: COLORS.ruleStrong, rank: 2 },
  ontrack:   { label: 'On track',     short: 'OK',   fg: COLORS.green,       bg: COLORS.greenSoft, border: COLORS.green,  rank: 3 },
}

// Map legacy red/yellow/green alertStatus → v2 urgency
export function urgencyFromAlertStatus(status?: string, stage?: Stage): Urgency {
  if (stage === 'closed') return 'ontrack'
  if (status === 'red') return 'critical'
  if (status === 'yellow') return 'attention'
  return 'ontrack'
}

// ── Button system ────────────────────────────────────────────────────────
export const BUTTON_VARIANTS = {
  primary:   { bg: '#1A3A28', color: '#FFFFFF', border: 'transparent',  hoverBg: '#0F2418' },
  secondary: { bg: '#FFFFFF', color: '#1A1A17', border: '#E5E1D8',      hoverBg: '#F5F3EF' },
  ghost:     { bg: 'transparent', color: '#6B6862', border: 'transparent', hoverBg: 'rgba(0,0,0,0.04)' },
  danger:    { bg: '#FCEFEC', color: '#8B2818', border: '#F0CFC7',      hoverBg: '#F8DDD7' },
} as const

export const BUTTON_SIZES = {
  sm: { padding: '4px 10px', fontSize: '12px', height: '26px', borderRadius: '6px' },
  md: { padding: '6px 14px', fontSize: '13px', height: '32px', borderRadius: '6px' },
  lg: { padding: '10px 18px', fontSize: '14px', height: '40px', borderRadius: '6px' },
} as const

// ── Time helpers ─────────────────────────────────────────────────────────
// Always pair time values with an explicit verb. Never render a bare "9d".
export function formatDays(days: number): string {
  if (days < 0) return 'future'
  if (days === 0) return 'today'
  if (days === 1) return '1 day'
  return `${days} days`
}

export function formatTimeSince(days: number, verb = 'since contact'): string {
  if (days <= 0) return 'today'
  return `${formatDays(days)} ${verb}`
}

/**
 * Unified relative-time formatter — single source of truth for all views.
 * opts.prefix = 'due' → forward-looking labels (Due today / Due in Nd / Overdue Nd)
 * No prefix      → backward-looking labels (Today / Yesterday / Nd ago / Nmo ago)
 */
export function relativeTime(
  date: Date,
  opts: { prefix?: 'due' } = {}
): string {
  const now = new Date()
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  // positive = date is in the past
  const pastDays = Math.round((nowDay - targetDay) / 86400000)

  if (opts.prefix === 'due') {
    const futureDays = -pastDays // positive = future
    if (futureDays < 0) {
      const n = Math.abs(futureDays)
      return `Overdue ${n}d`
    }
    if (futureDays === 0) return 'Due today'
    if (futureDays === 1) return 'Due tomorrow'
    if (futureDays < 30)  return `Due in ${futureDays}d`
    if (futureDays < 365) return `Due in ${Math.round(futureDays / 30)}mo`
    return `Due in ${Math.round(futureDays / 365)}y`
  }

  // Default: past-looking
  if (pastDays <= 0) return 'Today'
  if (pastDays === 1) return 'Yesterday'
  if (pastDays < 30)  return `${pastDays}d ago`
  if (pastDays < 365) return `${Math.round(pastDays / 30)}mo ago`
  return `${Math.round(pastDays / 365)}y ago`
}

// Threshold colors for "days since contact" — used on both Today and Pipeline
export function contactStaleness(days: number): { color: string; label: string } {
  if (days >= 14) return { color: COLORS.red,      label: `Stale ${days}d` }
  if (days >= 7)  return { color: COLORS.amber,    label: `Stale ${days}d` }
  if (days <= 0)  return { color: COLORS.warmGray, label: 'Today' }
  if (days === 1) return { color: COLORS.warmGray, label: 'Yesterday' }
  return { color: COLORS.warmGray, label: `${days}d ago` }
}

// ── Urgency scoring ──────────────────────────────────────────────────────
// Composite score used for "Today" sort and for the global urgency band.
// Higher = more urgent.
export interface CaseV2 {
  id: string
  insured: { first_name: string; last_name: string; age?: number; conditions?: string; is_anonymous?: boolean }
  policies: { face_amount: number; carrier?: string; product_type?: string }[]
  stage: Stage
  alertInfo: { status: string; reason?: string; days_since_contact?: number }

  // v2 enrichments (currently mocked in API; will come from Supabase later)
  probability?: number          // 0–1
  expected_close?: string       // ISO date
  last_activity?: { type: 'call' | 'email' | 'meeting' | 'note'; at: string; summary?: string }
  next_action?: { label: string; due?: string; kind?: 'call' | 'email' | 'task' | 'review' }
  owner?: { id: string; name: string; initials: string }
  source?: string
}

export function caseUrgency(c: CaseV2): Urgency {
  return urgencyFromAlertStatus(c.alertInfo?.status, c.stage)
}

export function urgencyScore(c: CaseV2): number {
  // Lower-is-more-urgent rank from URGENCY_META, plus secondary tiebreakers:
  //   - days since contact (more = more urgent)
  //   - face amount (larger = more urgent within same urgency)
  const base = URGENCY_META[caseUrgency(c)].rank * 1_000_000
  const days = (c.alertInfo?.days_since_contact ?? 0)
  const face = c.policies?.[0]?.face_amount ?? 0
  // Want: smaller score == more urgent
  return base - days * 100 - Math.log10(Math.max(face, 1)) * 1000
}

// Money formatter — consistent across all views
export function formatMoney(amount: number, opts: { compact?: boolean } = {}): string {
  if (!amount && amount !== 0) return '—'
  const compact = opts.compact ?? true
  if (compact) {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`
    if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`
    return `$${amount}`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`
}

// ── Type scale (v4 ramp — ruthlessly locked) ───────────────────────────
export const TYPE_SCALE = {
  display: { fontSize: '48px', lineHeight: '1.05', fontWeight: 700, letterSpacing: '-0.02em' },
  hero:    { fontSize: '48px', lineHeight: '1.05', fontWeight: 700, letterSpacing: '-0.02em' }, // alias → display
  h1:      { fontSize: '24px', lineHeight: '1.2',  fontWeight: 700, letterSpacing: '-0.015em' },
  h2:      { fontSize: '18px', lineHeight: '1.3',  fontWeight: 600, letterSpacing: '-0.01em' },
  h3:      { fontSize: '15px', lineHeight: '1.35', fontWeight: 600, letterSpacing: '-0.005em' },
  body:    { fontSize: '14px', lineHeight: '1.5',  fontWeight: 400 },
  small:   { fontSize: '13px', lineHeight: '1.45', fontWeight: 400 },
  label:   { fontSize: '13px', lineHeight: '1.3',  fontWeight: 500 },
  micro:   { fontSize: '11px', lineHeight: '1.3',  fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const },
  tabular: { fontVariantNumeric: 'tabular-nums' as const },
} as const

// ── Type scale (legacy — kept for compat) ───────────────────────────────
// Disciplined 5-step scale. No more freelancing.
export const TYPE = {
  // Display: brand moments only (page hero numbers, login)
  display: { fontFamily: 'Canela, Georgia, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '40px', lineHeight: 1.0, letterSpacing: '-0.01em' },
  // Title: page section headers
  title:   { fontFamily: 'Sohne, sans-serif', fontWeight: 700, fontSize: '20px', lineHeight: 1.2, letterSpacing: '-0.01em' },
  // Subtitle: card titles, table headers
  subtitle:{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '14px', lineHeight: 1.35, letterSpacing: '0' },
  // Body: default text
  body:    { fontFamily: 'Sohne, sans-serif', fontWeight: 400, fontSize: '13px', lineHeight: 1.5, letterSpacing: '0' },
  // Mono-data: numeric / tabular
  data:    { fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '14px', lineHeight: 1.2, letterSpacing: '0', fontVariantNumeric: 'tabular-nums' as const },
  // Label: small caps, tracked
  label:   { fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '10px', lineHeight: 1.2, letterSpacing: '0.12em', textTransform: 'uppercase' as const },
  // Micro: kbd hints, micro-meta
  micro:   { fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '11px', lineHeight: 1.2, letterSpacing: '0' },
} as const

// ── Density ──────────────────────────────────────────────────────────────
export type Density = 'compact' | 'comfortable'
export const DENSITY: Record<Density, { rowH: number; rowPad: string; cardPad: string }> = {
  compact:     { rowH: 36, rowPad: '8px 14px',  cardPad: '12px 14px' },
  comfortable: { rowH: 48, rowPad: '12px 18px', cardPad: '18px' },
}

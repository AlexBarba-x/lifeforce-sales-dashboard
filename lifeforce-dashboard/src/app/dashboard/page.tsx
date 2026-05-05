'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CaseV2, COLORS, TYPE, TYPE_SCALE, STAGE_META, formatMoney, formatPct,
  caseUrgency, urgencyScore, contactStaleness, URGENCY_META, formatDays,
} from '@/lib/design'
import { Pill, UrgencyPill } from '@/components/ui/Pill'
import { Avatar } from '@/components/ui/Avatar'
import { FilterBar, Chip } from '@/components/ui/FilterBar'

type AlertGrouped = {
  red: CaseV2[]
  yellow: CaseV2[]
  green: CaseV2[]
  stats: { total_face: number; active_count: number; bids_pending?: number }
}

// ── Helpers ────────────────────────────────────────────────────────────
function dueLabel(due?: string): { label: string; tone: 'red' | 'amber' | 'neutral' | 'green' } {
  if (!due) return { label: 'No due date', tone: 'neutral' }
  // Compare calendar days, not raw ms — avoids "overdue by 1d" for timezone-shifted ISO strings.
  const dueDate = new Date(due)
  const dueDay = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate())
  const now = new Date()
  const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((dueDay - todayDay) / 86400000)
  if (days < 0)  return { label: `Overdue ${Math.abs(days)}d`, tone: 'red' }
  if (days === 0) return { label: 'Due today',   tone: 'red' }
  if (days === 1) return { label: 'Due tomorrow', tone: 'amber' }
  if (days <= 3) return { label: `Due in ${days}d`, tone: 'amber' }
  return { label: `Due in ${days}d`, tone: 'neutral' }
}

// Use word labels instead of ambiguous glyphs for action types.
const ACTION_KIND_LABEL: Record<string, string> = {
  call: 'Call', email: 'Email', task: 'Task', review: 'Review', note: 'Note', meeting: 'Meeting',
}

function activityLabel(at: string): string {
  const d = new Date(at)
  const now = new Date()
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const days = Math.round((nowDay - targetDay) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days}d ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

// ── Triage card ─────────────────────────────────────────────────────────
// Ghost: transparent bg/border — for external app handoffs (Call, Email)
const GHOST_STYLE: React.CSSProperties = {
  ...TYPE.label,
  height: '26px',
  padding: '0 12px',
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  borderRadius: '6px',
  color: COLORS.warmGray,
  cursor: 'pointer',
  fontSize: '9px',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  lineHeight: 1,
  transition: 'background 120ms ease-out, color 120ms ease-out',
}
// Secondary: white bg + border — affirmative actions (Done)
const SECONDARY_STYLE: React.CSSProperties = {
  ...TYPE.label,
  height: '26px',
  padding: '0 10px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E1D8',
  borderRadius: '6px',
  color: '#1A1A17',
  cursor: 'pointer',
  fontSize: '9px',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  lineHeight: 1,
}

function ownerEmail(owner?: { id: string }): string {
  if (!owner) return 'abarba@lifeforcefinancial.com'
  return owner.id === 'user-jim' ? 'jim@lifeforcefinancial.com' : 'abarba@lifeforcefinancial.com'
}

function TriageCard({ c, onDone }: { c: CaseV2; onDone: (id: string) => void }) {
  const u = caseUrgency(c)
  const meta = URGENCY_META[u]
  const face = c.policies?.[0]?.face_amount ?? 0
  const due = dueLabel(c.next_action?.due)

  // Urgency-specific progressive treatment
  const bgColor = u === 'critical' ? '#FDF6F4' : u === 'attention' ? '#FDFAF1' : '#FFFFFF'
  const hoverBg = u === 'critical' ? '#FBEEEA' : u === 'attention' ? '#FAF3DD' : '#F8F7F3'
  const borderAccent = u === 'critical' ? '#C4452C' : u === 'attention' ? '#D4A017' : '#6B8F71'

  return (
    <Link
      href={`/dashboard/cases/${c.id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
      }}
    >
      <div style={{
        backgroundColor: bgColor,
        border: `1px solid ${COLORS.rule}`,
        borderLeft: `3px solid ${borderAccent}`,
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '14px',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background-color 120ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = hoverBg }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = bgColor }}
      >
        {/* Left column: alert reason → name → next action */}
        <div style={{ minWidth: 0 }}>
          {/* Reason (most important) */}
          <div style={{
            ...TYPE_SCALE.h3,
            fontFamily: 'Sohne, sans-serif',
            color: u === 'critical' ? COLORS.red : u === 'attention' ? COLORS.amber : COLORS.ink,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.alertInfo?.reason || c.next_action?.label || 'Active case'}
            </span>
          </div>

          {/* Name + meta */}
          <div style={{
            ...TYPE_SCALE.small,
            fontFamily: 'Sohne, sans-serif',
            color: COLORS.ink,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {c.insured.is_anonymous
                ? <><span style={{ fontStyle: 'italic', fontWeight: 400, color: COLORS.warmGray }}>Anonymous</span><span style={{ fontSize: '9px', letterSpacing: '0.06em', fontWeight: 600, color: '#7A7570', background: '#EAE6DF', borderRadius: '3px', padding: '1px 5px' }}>ANON</span></>
                : <>{c.insured.last_name}, {c.insured.first_name}</>}
            </span>
            <span style={{ color: COLORS.mutedGray }}>·</span>
            <span style={{ color: COLORS.warmGray }}>
              Age {c.insured.age} · {c.insured.conditions}
            </span>
          </div>

          {/* Next action */}
          {c.next_action && (
            <div style={{
              ...TYPE_SCALE.small,
              fontFamily: 'Sohne, sans-serif',
              color: COLORS.warmGray,
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              <span style={{
                ...TYPE.label,
                fontSize: '9px',
                color: COLORS.warmGray,
                padding: '2px 6px',
                backgroundColor: COLORS.parchmentDeep,
                borderRadius: '2px',
              }}>
                {ACTION_KIND_LABEL[c.next_action.kind || 'task']}
              </span>
              <span style={{ color: COLORS.ink2 }}>
                {c.next_action.label}
              </span>
              <Pill tone={due.tone === 'green' ? 'green' : due.tone} variant="soft" size="sm">
                {due.label}
              </Pill>
            </div>
          )}
        </div>

        {/* Right column: stage / face / owner / quick actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...TYPE.data, color: COLORS.ink }}>
              {formatMoney(face)}
            </div>
            <div style={{ ...TYPE.label, color: COLORS.warmGray, fontSize: '9px' }}>
              {STAGE_META[c.stage]?.label || c.stage}
            </div>
          </div>
          {c.owner && <Avatar initials={c.owner.initials} tone={u === 'critical' ? 'sage' : 'neutral'} />}
          <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.preventDefault()}>
            {/* Call */}
            <a
              href="tel:+17329213755"
              title="Call insured"
              style={GHOST_STYLE}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(26, 58, 40, 0.06)'; e.currentTarget.style.color = '#1A3A28' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = COLORS.warmGray }}
            >Call</a>
            {/* Email */}
            <a
              href={`mailto:${ownerEmail(c.owner)}?subject=${encodeURIComponent(`Re: ${c.insured.first_name} ${c.insured.last_name} — ${c.next_action?.label ?? 'Follow-up'}`)}`}
              title="Send email"
              style={GHOST_STYLE}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(26, 58, 40, 0.06)'; e.currentTarget.style.color = '#1A3A28' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = COLORS.warmGray }}
            >Email</a>
            {/* Done */}
            <button
              title="Mark action complete"
              style={GHOST_STYLE}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#FFFFFF'
                e.currentTarget.style.borderColor = '#E5E1D8'
                e.currentTarget.style.color = '#1A1A17'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.color = COLORS.warmGray
              }}
              onClick={e => { e.stopPropagation(); e.preventDefault(); onDone(c.id) }}
            >Done</button>
          </div>
        </div>
      </div>
    </Link>
  )
}



// ── Stack empty state ─────────────────────────────────────────────────
function StackEmptyState({ title }: { title: string }) {
  const isAction = title.toLowerCase().includes('action')
  const isFollowup = title.toLowerCase().includes('follow')
  const isClosing = title.toLowerCase().includes('closing')
  const mainText = isAction ? 'Nothing urgent.' : isFollowup ? 'No follow-ups queued.' : 'No deals closing this week.'
  const subText = isAction ? 'All action items handled.' : isFollowup ? 'Check back as due dates approach.' : 'Pipeline is building.'
  return (
    <div style={{
      height: '80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
    }}>
      <span style={{ fontSize: '24px', color: '#6B8F71', lineHeight: 1 }}>◎</span>
      <div style={{
        fontFamily: 'Canela, serif',
        fontStyle: 'italic',
        fontSize: '18px',
        fontWeight: 300,
        color: COLORS.ink,
        lineHeight: 1.2,
      }}>
        {mainText}
      </div>
      <div style={{
        fontFamily: 'Sohne, sans-serif',
        fontSize: '13px',
        color: COLORS.warmGray,
      }}>
        {subText}
      </div>
    </div>
  )
}

// ── Stack section ───────────────────────────────────────────────────────
function Stack({
  title,
  description,
  cases,
  emptyMsg,
  undoIds,
  onDone,
  onUndo,
}: {
  title: string
  description: string
  cases: CaseV2[]
  emptyMsg: string
  undoIds: Set<string>
  onDone: (id: string) => void
  onUndo: (id: string) => void
}) {
  const activeCases = cases.filter(c => !undoIds.has(c.id))
  const count = activeCases.length
  const totalFace = activeCases.reduce((s, c) => s + (c.policies?.[0]?.face_amount ?? 0), 0)

  return (
    <section style={{ marginBottom: '36px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '12px',
        marginBottom: '12px',
      }}>
        <h2 style={{ ...TYPE_SCALE.h2, fontFamily: 'Sohne, sans-serif', color: COLORS.ink, margin: 0 }}>
          {title}
        </h2>
        <span style={{ ...TYPE.body, color: COLORS.warmGray }}>
          {count} {count === 1 ? 'case' : 'cases'} · {formatMoney(totalFace)} face
        </span>
        <span style={{ ...TYPE.body, color: COLORS.mutedGray, marginLeft: 'auto' }}>
          {description}
        </span>
      </div>
      {cases.length === 0 ? (
        <StackEmptyState title={title} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cases.map(c => {
            if (undoIds.has(c.id)) {
              return (
                <div
                  key={c.id}
                  style={{
                    ...TYPE.body,
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.rule}`,
                    borderLeft: `3px solid ${COLORS.sage}`,
                    padding: '10px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: COLORS.warmGray,
                  }}
                >
                  <span style={{ fontSize: '12px' }}>✔︎ Action marked complete — {c.insured.last_name}, {c.insured.first_name}</span>
                  <button
                    onClick={() => onUndo(c.id)}
                    style={{
                      ...TYPE.label,
                      marginLeft: 'auto',
                      padding: '4px 10px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${COLORS.rule}`,
                      borderRadius: '3px',
                      color: COLORS.warmGray,
                      cursor: 'pointer',
                      fontSize: '9px',
                    }}
                  >
                    ↶ Undo
                  </button>
                </div>
              )
            }
            return <TriageCard key={c.id} c={c} onDone={onDone} />
          })}
        </div>
      )}
    </section>
  )
}

// ── Main: Today view ────────────────────────────────────────────────────
interface PendingApproval {
  id: string
  entity_type: string | null
  action_type: string | null
  requested_by: string | null
  created_at: string
  status: string | null
}

function timeAgo(iso: string): string {
  const now = new Date()
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1)   return 'just now'
  if (diffMin < 60)  return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24)   return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 30)  return `${diffDay}d ago`
  return `${Math.round(diffDay / 30)}mo ago`
}

export default function TodayPage() {
  const [allCases, setAllCases] = useState<CaseV2[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [undoIds, setUndoIds] = useState<Set<string>>(new Set())
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])

  const markActionDone = useCallback((caseId: string) => {
    setDoneIds(prev => new Set([...prev, caseId]))
    setUndoIds(prev => new Set([...prev, caseId]))
    setTimeout(() => {
      setUndoIds(prev => { const n = new Set(prev); n.delete(caseId); return n })
    }, 4000)
  }, [])

  const undoDone = useCallback((caseId: string) => {
    setDoneIds(prev => { const n = new Set(prev); n.delete(caseId); return n })
    setUndoIds(prev => { const n = new Set(prev); n.delete(caseId); return n })
  }, [])

  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then((d: CaseV2[]) => { setAllCases(d); setLoading(false) })
      .catch(() => setLoading(false))
    fetch('/api/pending-approvals')
      .then(r => r.json())
      .then((d: PendingApproval[]) => { if (Array.isArray(d)) setPendingApprovals(d) })
      .catch(() => {})
  }, [])

  // Filter by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return allCases
    const q = search.toLowerCase()
    return allCases.filter(c =>
      `${c.insured.first_name} ${c.insured.last_name}`.toLowerCase().includes(q) ||
      c.insured.conditions?.toLowerCase().includes(q) ||
      c.policies?.[0]?.carrier?.toLowerCase().includes(q) ||
      c.alertInfo?.reason?.toLowerCase().includes(q)
    )
  }, [allCases, search])

  // Bucket by Today's needs:
  // 1. Action Required: critical urgency or next_action overdue/due-today
  // 2. Follow-up Today: due in 1–3 days
  // 3. Closing This Week: stage=closing OR expected_close in next 7 days
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calendar-day diff (UTC-anchored) to keep tz-shifted ISO strings stable.
  const dayDiff = (iso: string): number => {
    const d = new Date(iso)
    const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    const now = new Date()
    const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.round((target - nowDay) / 86400000)
  }

  const buckets = useMemo(() => {
    const action: CaseV2[] = []
    const followup: CaseV2[] = []
    const closing: CaseV2[] = []
    const onTrack: CaseV2[] = []

    for (const c of filtered) {
      if (c.stage === 'closed') continue

      const u = caseUrgency(c)
      const dueDays = c.next_action?.due ? dayDiff(c.next_action.due) : null
      const closeDays = c.expected_close ? dayDiff(c.expected_close) : null

      const isAction = u === 'critical' || (dueDays !== null && dueDays <= 0)
      const isClosing = c.stage === 'closing' || (closeDays !== null && closeDays <= 7)
      const isFollowup = !isAction && (u === 'attention' || (dueDays !== null && dueDays >= 1 && dueDays <= 3))

      if (isAction) action.push(c)
      else if (isClosing) closing.push(c)
      else if (isFollowup) followup.push(c)
      else onTrack.push(c)
    }

    // Sort each bucket by urgency score (lower = more urgent)
    const sortFn = (a: CaseV2, b: CaseV2) => urgencyScore(a) - urgencyScore(b)
    return {
      action: action.sort(sortFn),
      followup: followup.sort(sortFn),
      closing: closing.sort(sortFn),
      onTrack: onTrack.sort(sortFn),
    }
  }, [filtered, today])

  // Cases that are permanently done (not in undo window) get excluded from buckets
  const effectiveDone = useMemo(
    () => new Set([...doneIds].filter(id => !undoIds.has(id))),
    [doneIds, undoIds]
  )

  const sumFace = (cs: CaseV2[]) => cs.reduce((s, c) => s + (c.policies?.[0]?.face_amount ?? 0), 0)

  // Top stats — focused on action, not vanity
  const totalPipelineFace = filtered
    .filter(c => c.stage !== 'closed')
    .reduce((s, c) => s + (c.policies?.[0]?.face_amount ?? 0), 0)
  const closingThisWeekFace = buckets.closing.reduce((s, c) => s + (c.policies?.[0]?.face_amount ?? 0), 0)
  const overdueCount = filtered.filter(c => {
    const d = c.alertInfo?.days_since_contact ?? 0
    return c.stage !== 'closed' && d >= 14
  }).length

  return (
    <div>
      {/* Page hero */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ ...TYPE.label, color: COLORS.sage, marginBottom: '6px' }}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 style={{
          fontFamily: 'Canela, serif',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: '36px',
          letterSpacing: '-0.01em',
          color: COLORS.ink,
          lineHeight: 1.0,
          margin: 0,
        }}>
          Today
        </h1>
      </div>

      {/* Compact, action-oriented stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '32px',
      }}>
        <StatTile
          label="Action required"
          value={String(buckets.action.length)}
          tone={buckets.action.length > 0 ? 'red' : 'neutral'}
          sub={buckets.action.length > 0 ? `${formatMoney(sumFace(buckets.action))} face` : 'all clear'}
        />
        <StatTile
          label="Follow-up this week"
          value={String(buckets.followup.length)}
          tone={buckets.followup.length > 0 ? 'amber' : 'neutral'}
          sub={`${formatMoney(sumFace(buckets.followup))} face`}
        />
        <StatTile
          label="Closing within 7d"
          value={String(buckets.closing.length)}
          tone="green"
          sub={`${closingThisWeekFace === 0 ? '—' : formatMoney(closingThisWeekFace)} face`}
        />
        <StatTile
          label="Active pipeline"
          value={totalPipelineFace === 0 ? '—' : formatMoney(totalPipelineFace)}
          tone="neutral"
          sub={`${filtered.filter(c => c.stage !== 'closed').length} cases · ${overdueCount} stale`}
        />
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by name, condition, carrier…"
      />

      {loading ? (
        <p style={{ ...TYPE.body, color: COLORS.warmGray }}>Loading…</p>
      ) : (
        <>
          <Stack
            title="Action required"
            description="critical urgency or overdue actions"
            cases={buckets.action.filter(c => !effectiveDone.has(c.id))}
            emptyMsg="Nothing on fire. Nice."
            undoIds={undoIds}
            onDone={markActionDone}
            onUndo={undoDone}
          />
          <Stack
            title="Follow-up this week"
            description="due in the next 3 days"
            cases={buckets.followup.filter(c => !effectiveDone.has(c.id))}
            emptyMsg="No follow-ups queued."
            undoIds={undoIds}
            onDone={markActionDone}
            onUndo={undoDone}
          />
          <Stack
            title="Closing within 7 days"
            description="contracts in motion"
            cases={buckets.closing.filter(c => !effectiveDone.has(c.id))}
            emptyMsg="No deals closing this week."
            undoIds={undoIds}
            onDone={markActionDone}
            onUndo={undoDone}
          />
          {buckets.onTrack.filter(c => !effectiveDone.has(c.id)).length > 0 && (
            <Stack
              title="On track"
              description="no action needed"
              cases={buckets.onTrack.filter(c => !effectiveDone.has(c.id))}
              emptyMsg="—"
              undoIds={undoIds}
              onDone={markActionDone}
              onUndo={undoDone}
            />
          )}

          {/* Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <section style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
                <h2 style={{ fontFamily: 'Sohne, sans-serif', fontSize: '18px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
                  Pending Approvals
                </h2>
                <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#6B6B6B' }}>
                  {pendingApprovals.length} {pendingApprovals.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingApprovals.map(approval => (
                  <div key={approval.id} style={{
                    borderLeft: '3px solid #D4A017',
                    backgroundColor: '#FFFFFF',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    border: '1px solid #E5E3DF',
                    borderLeftWidth: '3px',
                    borderLeftColor: '#D4A017',
                  }}>
                    {approval.entity_type && (
                      <span style={{
                        fontFamily: 'Sohne, sans-serif',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#D4A017',
                        backgroundColor: '#F5EAD8',
                        borderRadius: '3px',
                        padding: '2px 8px',
                        flexShrink: 0,
                      }}>
                        {approval.entity_type}
                      </span>
                    )}
                    <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#2A2A2A', flex: 1 }}>
                      {approval.action_type ?? 'Approval required'}
                    </span>
                    {approval.requested_by && (
                      <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: '#7A7A7A' }}>
                        {approval.requested_by}
                      </span>
                    )}
                    <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: '#9A9A9A', flexShrink: 0 }}>
                      {timeAgo(approval.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function StatTile({ label, value, sub, tone }: {
  label: string
  value: string
  sub?: string
  tone: 'red' | 'amber' | 'green' | 'neutral'
}) {
  const accent = tone === 'red' ? COLORS.red
    : tone === 'amber' ? COLORS.amber
    : tone === 'green' ? COLORS.green
    : COLORS.warmGray
  return (
    <div style={{
      backgroundColor: COLORS.surface,
      border: `1px solid #E5DFD5`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: '8px',
      padding: '24px',
    }}>
      {/* Number first — the focal point */}
      <div style={{
        fontFamily: 'Sohne, sans-serif',
        ...TYPE_SCALE.display,
        fontVariantNumeric: 'tabular-nums',
        color: tone === 'neutral' ? COLORS.ink : accent,
        marginBottom: '8px',
      }}>
        {value}
      </div>
      {/* Label below number */}
      <div style={{
        ...TYPE_SCALE.micro,
        fontFamily: 'Sohne, sans-serif',
        color: COLORS.warmGray,
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}>
        {tone === 'red' && (
          <span style={{ color: COLORS.red, fontSize: '8px', lineHeight: 1 }}>●</span>
        )}
        {label}
      </div>
      {sub && (
        <div style={{ ...TYPE_SCALE.label, fontFamily: 'Sohne, sans-serif', color: '#6B6862', marginTop: '8px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

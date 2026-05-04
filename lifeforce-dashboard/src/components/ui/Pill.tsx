import { CSSProperties } from 'react'
import { COLORS, TYPE, URGENCY_META, Urgency } from '@/lib/design'

interface PillProps {
  tone?: 'neutral' | 'red' | 'amber' | 'green' | 'blue' | Urgency
  variant?: 'soft' | 'outline' | 'solid'
  children: React.ReactNode
  icon?: React.ReactNode
  size?: 'sm' | 'md'
  title?: string
  style?: CSSProperties
}

const TONE_COLORS: Record<string, { fg: string; bg: string; border: string }> = {
  neutral:   { fg: COLORS.warmGray, bg: COLORS.parchmentDeep, border: COLORS.ruleStrong },
  red:       { fg: COLORS.red,      bg: COLORS.redSoft,       border: COLORS.red },
  amber:     { fg: COLORS.amber,    bg: COLORS.amberSoft,     border: COLORS.amber },
  green:     { fg: COLORS.green,    bg: COLORS.greenSoft,     border: COLORS.green },
  blue:      { fg: COLORS.blue,     bg: COLORS.blueSoft,      border: COLORS.blue },
  critical:  URGENCY_META.critical,
  attention: URGENCY_META.attention,
  monitor:   URGENCY_META.monitor,
  ontrack:   URGENCY_META.ontrack,
}

export function Pill({ tone = 'neutral', variant = 'soft', children, icon, size = 'md', title, style }: PillProps) {
  const c = TONE_COLORS[tone] || TONE_COLORS.neutral
  const padding = size === 'sm' ? '2px 8px' : '4px 10px'
  const fontSize = size === 'sm' ? '10px' : '11px'

  let bg = c.bg
  let fg = c.fg
  let border = c.border

  if (variant === 'outline') {
    bg = 'transparent'
    fg = c.border
  } else if (variant === 'solid') {
    bg = c.border
    fg = '#FFFFFF'
    border = c.border
  }

  return (
    <span
      title={title}
      style={{
        ...TYPE.micro,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding,
        fontSize,
        color: fg,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: '3px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  )
}

export function UrgencyPill({ urgency, size = 'md' }: { urgency: Urgency; size?: 'sm' | 'md' }) {
  const meta = URGENCY_META[urgency]
  return (
    <Pill tone={urgency} variant="soft" size={size} title={`Urgency: ${meta.label}`}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: meta.border,
        flexShrink: 0,
      }} />
      {meta.label}
    </Pill>
  )
}

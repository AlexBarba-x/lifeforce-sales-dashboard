import { COLORS, TYPE } from '@/lib/design'

export function Avatar({ initials, size = 24, tone = 'neutral' }: { initials: string; size?: number; tone?: 'sage' | 'neutral' }) {
  const bg = tone === 'sage' ? COLORS.sage : COLORS.parchmentDeep
  const fg = tone === 'sage' ? '#FFFFFF' : COLORS.warmGray
  return (
    <span
      style={{
        ...TYPE.micro,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        color: fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.42),
        fontWeight: 600,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </span>
  )
}

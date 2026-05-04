import { COLORS, TYPE } from '@/lib/design'

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd style={{
      ...TYPE.micro,
      display: 'inline-block',
      padding: '1px 6px',
      backgroundColor: COLORS.surfaceAlt,
      border: `1px solid ${COLORS.ruleStrong}`,
      borderBottomWidth: '2px',
      borderRadius: '3px',
      color: COLORS.warmGray,
      fontFamily: 'ui-monospace, Menlo, monospace',
      fontSize: '10px',
      lineHeight: 1.2,
    }}>
      {children}
    </kbd>
  )
}

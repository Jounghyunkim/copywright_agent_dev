export function StepIndicator({ step, label, active, done, onClick }: {
  step: number
  label: string
  active: boolean
  done: boolean
  onClick?: () => void
}) {
  const clickable = !!(onClick && (active || done))
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        cursor: clickable ? 'pointer' : 'default',
      }}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        background: done ? 'var(--success, #22c55e)' : active ? 'var(--lg-red-700)' : 'var(--neutral-200)',
        color: done || active ? '#fff' : 'var(--neutral-500)',
      }}>
        {done ? '\u2713' : step}
      </span>
      <small style={{
        fontWeight: 600,
        color: done ? 'var(--success)' : active ? 'var(--neutral-900)' : 'var(--neutral-500)',
      }}>
        {label}
      </small>
    </div>
  )
}

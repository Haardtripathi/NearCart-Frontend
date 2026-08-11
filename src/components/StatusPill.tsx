type StatusTone = 'success' | 'neutral' | 'danger' | 'warning'

export interface StatusPillProps {
  label: string
  tone?: StatusTone
}

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
}

const dotClasses: Record<StatusTone, string> = {
  success: 'bg-emerald-500',
  neutral: 'bg-ink-400',
  danger: 'bg-rose-500',
  warning: 'bg-amber-500',
}

export function StatusPill({
  label,
  tone = 'neutral',
}: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ring-1 ${toneClasses[tone]}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[tone]}`} />
      {label}
    </span>
  )
}

type StatusTone = 'success' | 'neutral' | 'danger' | 'warning'

interface StatusPillProps {
  label: string
  tone?: StatusTone
}

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  danger: 'bg-rose-100 text-rose-700 ring-rose-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
}

export function StatusPill({
  label,
  tone = 'neutral',
}: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ring-1 ${toneClasses[tone]}`}
    >
      {label}
    </span>
  )
}

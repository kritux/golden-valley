import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
}

export function StatCard({ label, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <div
      className={[
        'relative bg-[var(--black-card)] rounded-sm p-5',
        'border border-[var(--black-border)]',
        'border-l-2 border-l-[var(--gold)]',
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[var(--white-muted)] text-xs uppercase tracking-widest mb-1 font-medium">
            {label}
          </p>
          <p className="text-[var(--white)] text-2xl font-semibold font-[var(--font-dm-mono)] truncate">
            {value}
          </p>
          {trend && (
            <p
              className={[
                'text-xs mt-1.5 font-medium',
                trend.positive ? 'text-green-400' : 'text-red-400',
              ].join(' ')}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 text-[var(--gold)] opacity-70">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

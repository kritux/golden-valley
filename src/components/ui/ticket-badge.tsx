interface TicketBadgeProps {
  number: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { container: 'px-2 py-1 text-xs', frame: 'text-[var(--gold-dark)] text-[10px]' },
  md: { container: 'px-3 py-1.5 text-sm', frame: 'text-[var(--gold-dark)] text-xs' },
  lg: { container: 'px-5 py-2.5 text-xl', frame: 'text-[var(--gold-dark)] text-sm' },
}

export function TicketBadge({ number, size = 'md', className = '' }: TicketBadgeProps) {
  const styles = sizeMap[size]
  const padded = String(number).padStart(4, '0')

  return (
    <span
      className={[
        'inline-flex flex-col items-center',
        'border border-[var(--gold)] rounded-sm',
        'bg-[var(--black-card)]',
        'font-[var(--font-dm-mono)] tracking-widest',
        styles.container,
        className,
      ].join(' ')}
    >
      <span className={['uppercase tracking-[0.2em]', styles.frame].join(' ')}>
        TICKET
      </span>
      <span className="text-[var(--gold-light)] leading-none">
        #{padded}
      </span>
    </span>
  )
}

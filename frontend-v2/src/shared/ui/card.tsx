import { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <section className={cn('card', className)} style={style}>
      {children}
    </section>
  )
}

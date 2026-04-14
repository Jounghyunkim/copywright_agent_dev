import { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary'

export function Badge({ children, tone = 'neutral', style, title }: { children: ReactNode; tone?: Tone; style?: CSSProperties; title?: string }) {
  return <span className={cn('badge', `badge-${tone}`)} style={style} title={title}>{children}</span>
}

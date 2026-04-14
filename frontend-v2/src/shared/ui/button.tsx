import { ButtonHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        className,
      )}
      {...props}
    />
  )
}

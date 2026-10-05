import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const typographyVariants = cva('font-mono', {
  variants: {
    variant: {
      H1: 'text-3xl font-bold uppercase tracking-[0.15em] text-[var(--color-green)] text-shadow-[var(--text-glow-green)]',
      H2: 'text-2xl font-semibold uppercase tracking-[0.12em] text-[var(--color-green)]',
      H3: 'text-xl font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]',
      H4: 'text-base font-medium uppercase tracking-widest text-[var(--text-secondary)]',
      P: 'text-sm leading-relaxed text-[var(--text-secondary)]',
      LEAD: 'text-base leading-relaxed text-[var(--text-secondary)] opacity-90',
      LABEL: 'text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]',
      CAPTION: 'text-[0.7rem] text-[var(--text-muted)] tracking-wide',
      MUTED: 'text-xs text-[var(--text-muted)]',
      CODE: 'text-sm bg-[var(--surface-raised)] border border-[var(--border)] px-1.5 py-0.5 text-[var(--color-green)] inline-block',
      TERMINAL: 'text-xs bg-[var(--surface)] border-l-2 border-[var(--color-green)] pl-2 py-1 text-[var(--color-green)]',
    },
    color: {
      default: '',
      green: 'text-[var(--color-green)]',
      amber: 'text-[var(--color-amber)]',
      red: 'text-[var(--color-red)]',
      blue: 'text-[var(--color-blue)]',
      bone: 'text-[var(--color-bone)]',
      teal: 'text-[var(--color-teal)]',
      pink: 'text-[var(--color-pink)]',
      orange: 'text-[var(--color-orange)]',
      purple: 'text-[var(--color-purple)]',
      muted: 'text-[var(--text-muted)]',
    },
    glow: {
      none: '',
      green: 'text-shadow-[var(--text-glow-green)]',
      amber: 'text-shadow-[var(--text-glow-amber)]',
      red: 'text-shadow-[var(--text-glow-red)]',
      blue: 'text-shadow-[var(--text-glow-blue)]',
      teal: 'text-shadow-[var(--text-glow-teal)]',
      pink: 'text-shadow-[var(--text-glow-pink)]',
      orange: 'text-shadow-[var(--text-glow-orange)]',
    },
  },
  defaultVariants: {
    variant: 'P',
    color: 'default',
    glow: 'none',
  },
})

type VariantElement = {
  H1: 'h1'
  H2: 'h2'
  H3: 'h3'
  H4: 'h4'
  P: 'p'
  LEAD: 'p'
  LABEL: 'span'
  CAPTION: 'span'
  MUTED: 'p'
  CODE: 'code'
  TERMINAL: 'div'
}

const variantTag: VariantElement = {
  H1: 'h1',
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  P: 'p',
  LEAD: 'p',
  LABEL: 'span',
  CAPTION: 'span',
  MUTED: 'p',
  CODE: 'code',
  TERMINAL: 'div',
}

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: keyof React.JSX.IntrinsicElements
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'P', color, glow, as, children, ...props }, ref) => {
    const Tag = (as ?? variantTag[variant as keyof VariantElement] ?? 'p') as React.ElementType
    return (
      <Tag
        ref={ref}
        className={cn(typographyVariants({ variant, color, glow }), className)}
        {...props}
      >
        {children}
      </Tag>
    )
  }
)
Typography.displayName = 'Typography'

export { Typography, typographyVariants }

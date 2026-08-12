import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GridFrameProps {
	children: ReactNode
	className?: string
	lineClassName?: string
	offset?: number
}

export function GridFrame({ children, className, lineClassName, offset = 24 }: GridFrameProps) {
	const rule = cn('pointer-events-none absolute border-primary-foreground/50', lineClassName)

	return (
		<div
			className={cn('relative isolate', className)}
			style={{ '--grid-frame-offset': `${offset}px` } as CSSProperties}
		>
			<div
				className={cn(
					rule,
					'-left-(--grid-frame-offset) -right-(--grid-frame-offset) top-0 border-t',
				)}
			/>
			<div
				className={cn(
					rule,
					'-left-(--grid-frame-offset) -right-(--grid-frame-offset) bottom-0 border-t',
				)}
			/>
			<div
				className={cn(
					rule,
					'-top-(--grid-frame-offset) -bottom-(--grid-frame-offset) left-0 border-l',
				)}
			/>
			<div
				className={cn(
					rule,
					'-top-(--grid-frame-offset) -bottom-(--grid-frame-offset) right-0 border-l',
				)}
			/>

			<div className="relative z-10">{children}</div>
		</div>
	)
}

import type { LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface MobileNavItem {
	title: string
	url: string
	icon: LucideIcon
}

interface MobileBottomNavProps {
	items: MobileNavItem[]
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
	const { pathname } = useLocation()

	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
			<div className="flex items-center justify-around h-16">
				{items.map((item) => {
					const active = pathname === item.url

					return (
						<Link
							key={item.url}
							to={item.url}
							className={cn(
								'flex flex-col items-center gap-1 text-xs px-3 py-2 transition-colors',
								active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
							)}
						>
							<item.icon className={cn('size-5', active && 'fill-primary/20')} />
							<span>{item.title}</span>
						</Link>
					)
				})}
			</div>
		</nav>
	)
}

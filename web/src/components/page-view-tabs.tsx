import type { LucideIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface IViewOption {
	value: string
	label: string
	icon: LucideIcon
}

interface IPageViewTabsProps<TView extends string> {
	views: readonly IViewOption[]
	value: TView
	onChange: (view: TView) => void
	className?: string
}

/**
 * View switcher for a page toolbar. It is presentational: the page owns the
 * view, the same way the calendar pages own theirs.
 */
export function PageViewTabs<TView extends string>({
	views,
	value,
	onChange,
	className,
}: IPageViewTabsProps<TView>) {
	return (
		<Tabs value={value} onValueChange={(next) => onChange(next as TView)} className={className}>
			<TabsList>
				{views.map(({ value: option, label, icon: Icon }) => (
					<TabsTrigger key={option} value={option} className="gap-1.5">
						<Icon className="size-4" />
						<span className="max-md:sr-only">{label}</span>
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	)
}

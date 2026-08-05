import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { IViewOption } from '@/hooks/use-route-handle'
import { useViewParam } from '@/hooks/use-view-param'

interface IPageViewTabsProps {
	views: readonly IViewOption[]
}

export function PageViewTabs({ views }: IPageViewTabsProps) {
	const values = views.map((option) => option.value)
	const [view, setView] = useViewParam(values, values[0])

	return (
		<Tabs value={view} onValueChange={setView}>
			<TabsList>
				{views.map(({ value, label, icon: Icon }) => (
					<TabsTrigger key={value} value={value} className="gap-1.5">
						<Icon className="size-4" />
						<span className="max-md:sr-only">{label}</span>
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	)
}

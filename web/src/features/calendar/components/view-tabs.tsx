import { CalendarDays, CalendarRange, LayoutList, Rows3 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCalendar } from '@/features/calendar/calendar-provider'
import type { TCalendarView } from '@/features/calendar/types'

const VIEW_OPTIONS: Record<
	TCalendarView,
	{ label: string; icon: typeof CalendarDays }
> = {
	day: { label: 'Day', icon: Rows3 },
	week: { label: 'Week', icon: CalendarRange },
	month: { label: 'Month', icon: CalendarDays },
	agenda: { label: 'Agenda', icon: LayoutList },
}

export function ViewTabs({ views }: { views: readonly TCalendarView[] }) {
	const { view, setView } = useCalendar()

	return (
		<Tabs value={view} onValueChange={(value) => setView(value as TCalendarView)}>
			<TabsList>
				{views.map((value) => {
					const { label, icon: Icon } = VIEW_OPTIONS[value]

					return (
						<TabsTrigger key={value} value={value} className="gap-1.5">
							<Icon className="size-4" />
							<span className="max-md:sr-only">{label}</span>
						</TabsTrigger>
					)
				})}
			</TabsList>
		</Tabs>
	)
}

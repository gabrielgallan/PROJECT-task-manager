import { CalendarDays, CalendarRange, LayoutList, Rows3 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import type { TCalendarView } from '@/features/calendar/types'

const VIEWS: { value: TCalendarView; label: string; icon: typeof CalendarDays }[] = [
	{ value: 'day', label: 'Day', icon: Rows3 },
	{ value: 'week', label: 'Week', icon: CalendarRange },
	{ value: 'month', label: 'Month', icon: CalendarDays },
	{ value: 'agenda', label: 'Agenda', icon: LayoutList },
]

export function ViewTabs() {
	const { view, setView } = useCalendar()

	return (
		<Tabs value={view} onValueChange={(value) => setView(value as TCalendarView)}>
			<TabsList>
				{VIEWS.map(({ value, label, icon: Icon }) => (
					<TabsTrigger key={value} value={value} className="gap-1.5">
						<Icon className="size-4" />
						<span className="max-md:sr-only">{label}</span>
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	)
}

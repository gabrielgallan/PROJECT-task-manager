import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as MiniCalendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { WORK_DAY_START_HOUR } from '@/features/calendar/constants'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { navigateDate, rangeText } from '@/features/calendar/helpers'
import { PlanFilter } from '@/features/calendar/plan-filter'
import { CalendarSettings } from '@/features/calendar/settings'
import { ViewTabs } from '@/features/calendar/view-tabs'

export function CalendarHeader() {
	const { view, selectedDate, setSelectedDate, goToToday, openCreatePlan } = useCalendar()

	const handleNewPlan = () => {
		const start = new Date(selectedDate)
		start.setHours(WORK_DAY_START_HOUR, 0, 0, 0)
		openCreatePlan(start)
	}

	return (
		<header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
			<div className="flex items-center gap-2">
				{/* <Button variant="outline" size="sm" onClick={goToToday}>
					Today
				</Button> */}

				<div className="flex items-center">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Previous"
						onClick={() => setSelectedDate(navigateDate(selectedDate, view, 'previous'))}
					>
						<ChevronLeft />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Next"
						onClick={() => setSelectedDate(navigateDate(selectedDate, view, 'next'))}
					>
						<ChevronRight />
					</Button>
				</div>

				<Popover>
					<PopoverTrigger render={<Button variant="ghost" size="sm" />}>
						<span className="text-sm font-semibold">{rangeText(view, selectedDate)}</span>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-auto p-0">
						<MiniCalendar
							mode="single"
							selected={selectedDate}
							onSelect={setSelectedDate}
							autoFocus
						/>
					</PopoverContent>
				</Popover>
			</div>

			<div className="flex items-center gap-2">
				<PlanFilter />
				<ViewTabs />
				<CalendarSettings />

				<Button size="sm" onClick={handleNewPlan}>
					<Plus />
					<span className="max-md:sr-only">New plan</span>
				</Button>
			</div>
		</header>
	)
}

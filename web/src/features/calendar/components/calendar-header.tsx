import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as MiniCalendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCalendar } from '@/features/calendar/calendar-provider'
import { CalendarSettings } from '@/features/calendar/components/calendar-settings'
import { ViewTabs } from '@/features/calendar/components/view-tabs'
import { navigateDate, rangeText } from '@/features/calendar/lib/date'
import type { ICalendarProps, ICalendarItem } from '@/features/calendar/types'

type THeaderProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	'availableViews' | 'settings' | 'renderToolbarActions' | 'renderSettingsItems'
>

export function CalendarHeader<TItem extends ICalendarItem>({
	availableViews = [],
	settings,
	renderToolbarActions,
	renderSettingsItems,
}: THeaderProps<TItem>) {
	const { view, selectedDate, setSelectedDate } = useCalendar()
	const actions = renderToolbarActions?.({ selectedDate, view })
	const settingsItems = settings === false ? undefined : renderSettingsItems?.()
	const showTimeFormat = settings !== false && (settings?.timeFormat ?? true)
	const showWeekends = settings !== false && (settings?.weekends ?? true)
	const showSettings = settings !== false && (showTimeFormat || showWeekends || settingsItems != null)

	return (
		<header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
			<div className="flex items-center gap-2">
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
				{actions?.beforeViews}
				{availableViews.length > 1 && <ViewTabs views={availableViews} />}
				{showSettings && (
					<CalendarSettings
						extraItems={settingsItems}
						showTimeFormat={showTimeFormat}
						showWeekends={showWeekends}
					/>
				)}
				{actions?.afterSettings}
			</div>
		</header>
	)
}

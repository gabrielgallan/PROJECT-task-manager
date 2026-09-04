import { CalendarBody } from '@/features/calendar/calendar-body'
import { CalendarProvider, useCalendar } from '@/features/calendar/calendar-provider'
import { CalendarHeader } from '@/features/calendar/components/calendar-header'
import { DragDropProvider } from '@/features/calendar/interactions/drag-drop-context'
import { getVisibleCalendarRange } from '@/features/calendar/lib/date'
import '@/features/calendar/styles/calendar-scrollbar.css'
import { useLayoutEffect, useMemo } from 'react'
import { CALENDAR_VIEWS, type ICalendarItem, type ICalendarProps } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

function CalendarContent<TItem extends ICalendarItem>({
	items,
	className,
	onCreate,
	onOpen,
	onMove,
	onResize,
	renderItem,
	getItemClassName,
	isItemDisabled,
	getAgendaEmptyText,
	renderToolbarActions,
	renderSettingsItems,
	renderOverlay,
	onVisibleRangeChange,
	itemsRange,
	availableViews = CALENDAR_VIEWS,
	settings,
}: ICalendarProps<TItem>) {
	const { selectedDate, view, use24HourFormat } = useCalendar()
	const visibleRange = useMemo(
		() => getVisibleCalendarRange(view, selectedDate),
		[view, selectedDate],
	)
	useLayoutEffect(() => onVisibleRangeChange?.(visibleRange), [onVisibleRangeChange, visibleRange])
	const rangeMatches =
		itemsRange &&
		itemsRange.startDate.getTime() === visibleRange.startDate.getTime() &&
		itemsRange.endDate.getTime() === visibleRange.endDate.getTime()

	return (
		<>
			<div
				className={cn(
					'flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl bg-background',
					className,
				)}
			>
				<CalendarHeader
					availableViews={availableViews}
					settings={settings}
					renderToolbarActions={renderToolbarActions}
					renderSettingsItems={renderSettingsItems}
				/>
				<CalendarBody
					items={itemsRange && !rangeMatches ? [] : items}
					onCreate={onCreate}
					onOpen={onOpen}
					onMove={onMove}
					onResize={onResize}
					renderItem={renderItem}
					getItemClassName={getItemClassName}
					isItemDisabled={isItemDisabled}
					getAgendaEmptyText={getAgendaEmptyText}
				/>
			</div>

			{renderOverlay?.({ selectedDate, view, use24HourFormat })}
		</>
	)
}

export function Calendar<TItem extends ICalendarItem>({
	defaultView = 'week',
	availableViews = CALENDAR_VIEWS,
	storageKey = 'task_manager.calendar-settings',
	getNow,
	...props
}: ICalendarProps<TItem>) {
	const views = availableViews.length > 0 ? availableViews : CALENDAR_VIEWS
	const initialView = views.includes(defaultView) ? defaultView : (views[0] ?? 'week')

	return (
		<CalendarProvider
			defaultView={initialView}
			availableViews={views}
			storageKey={storageKey}
			getNow={getNow}
		>
			<DragDropProvider>
				<CalendarContent
					defaultView={initialView}
					availableViews={views}
					storageKey={storageKey}
					{...props}
				/>
			</DragDropProvider>
		</CalendarProvider>
	)
}

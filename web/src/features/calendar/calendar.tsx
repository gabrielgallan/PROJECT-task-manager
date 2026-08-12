import { CalendarBody } from '@/features/calendar/calendar-body'
import { CalendarProvider, useCalendar } from '@/features/calendar/calendar-provider'
import { CalendarHeader } from '@/features/calendar/components/calendar-header'
import { DragDropProvider } from '@/features/calendar/interactions/drag-drop-context'
import '@/features/calendar/styles/calendar-scrollbar.css'
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
	getAgendaEmptyText,
	renderToolbarActions,
	renderSettingsItems,
	renderOverlay,
	availableViews = CALENDAR_VIEWS,
	settings,
}: ICalendarProps<TItem>) {
	const { selectedDate, view, use24HourFormat } = useCalendar()

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
					items={items}
					onCreate={onCreate}
					onOpen={onOpen}
					onMove={onMove}
					onResize={onResize}
					renderItem={renderItem}
					getItemClassName={getItemClassName}
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
	...props
}: ICalendarProps<TItem>) {
	const views = availableViews.length > 0 ? availableViews : CALENDAR_VIEWS
	const initialView = views.includes(defaultView) ? defaultView : (views[0] ?? 'week')

	return (
		<CalendarProvider defaultView={initialView} availableViews={views} storageKey={storageKey}>
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

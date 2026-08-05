import { isToday } from 'date-fns'
import { type ReactNode, useEffect, useRef } from 'react'
import { useCalendar } from '@/features/calendar/calendar-provider'
import { CurrentTimeIndicator } from '@/features/calendar/components/current-time-indicator'
import { DroppableSlot } from '@/features/calendar/components/droppable-slot'
import { TimeItem } from '@/features/calendar/components/time-item'
import {
	HOURS,
	HOUR_HEIGHT,
	SLOT_MINUTES,
	SLOTS_PER_HOUR,
	WORK_DAY_END_HOUR,
	WORK_DAY_START_HOUR,
} from '@/features/calendar/constants'
import { useDragDrop } from '@/features/calendar/interactions/drag-drop-context'
import { formatHourLabel } from '@/features/calendar/lib/formatting'
import { getItemsForDay, layoutDayItems, moveItemTo } from '@/features/calendar/lib/layout'
import type { ICalendarItem, ICalendarProps } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

export const GUTTER_CLASS = 'w-14 shrink-0'
const SLOT_HEIGHT = HOUR_HEIGHT / SLOTS_PER_HOUR

export function TimeGutter() {
	const { use24HourFormat } = useCalendar()

	return (
		<div className={cn('relative', GUTTER_CLASS)}>
			{HOURS.map((hour) => (
				<div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
					{hour !== 0 && (
						<span className="absolute -top-2 right-2 text-[11px] text-muted-foreground tabular-nums">
							{formatHourLabel(hour, use24HourFormat)}
						</span>
					)}
				</div>
			))}
		</div>
	)
}

type TDayColumnProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	'onCreate' | 'onOpen' | 'onMove' | 'onResize' | 'renderItem' | 'getItemClassName'
> & {
	day: Date
	items: TItem[]
	showCurrentTimeLabel?: boolean
}

export function DayColumn<TItem extends ICalendarItem>({
	day,
	items,
	showCurrentTimeLabel = false,
	onCreate,
	onOpen,
	onMove,
	onResize,
	renderItem,
	getItemClassName,
}: TDayColumnProps<TItem>) {
	const layouts = layoutDayItems(getItemsForDay(items, day))
	const { activeItemId, endDrag } = useDragDrop()

	const handleDropItem = (targetDay: Date, hour: number, minute: number) => {
		const item = items.find((candidate) => candidate.id === activeItemId)
		if (!item) return
		const range = moveItemTo(item, targetDay, hour, minute)
		if (range.startDate.getTime() !== new Date(item.startDate).getTime()) onMove?.(item, range)
		endDrag()
	}

	return (
		<div className="relative flex-1">
			{HOURS.map((hour) => (
				<div
					key={hour}
					className={cn(
						'relative border-b border-border/60',
						(hour < WORK_DAY_START_HOUR || hour >= WORK_DAY_END_HOUR) && 'bg-muted/40',
					)}
					style={{ height: HOUR_HEIGHT }}
				>
					<div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-border/40" />

					{Array.from({ length: SLOTS_PER_HOUR }, (_, slot) => (
						<DroppableSlot
							key={slot}
							day={day}
							hour={hour}
							minute={slot * SLOT_MINUTES}
							style={{ top: slot * SLOT_HEIGHT, height: SLOT_HEIGHT }}
							onCreate={onCreate}
							onDropItem={handleDropItem}
						/>
					))}
				</div>
			))}

			{layouts.map((layout) => (
				<TimeItem
					key={layout.item.id}
					layout={layout}
					day={day}
					onOpen={onOpen}
					onMove={onMove}
					onResize={onResize}
					renderItem={renderItem}
					getItemClassName={getItemClassName}
				/>
			))}

			{isToday(day) && <CurrentTimeIndicator showLabel={showCurrentTimeLabel} />}
		</div>
	)
}

export function TimeGridScroller({ children }: { children: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (ref.current) ref.current.scrollTop = WORK_DAY_START_HOUR * HOUR_HEIGHT
	}, [])

	return (
		<div
			ref={ref}
			className="calendar-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
		>
			{children}
		</div>
	)
}

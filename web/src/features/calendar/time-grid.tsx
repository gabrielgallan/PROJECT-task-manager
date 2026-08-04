import { isToday } from 'date-fns'
import { type ReactNode, useEffect, useRef } from 'react'
import {
	HOUR_HEIGHT,
	SLOT_MINUTES,
	SLOTS_PER_HOUR,
	WORK_DAY_START_HOUR,
} from '@/features/calendar/constants'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { CurrentTimeIndicator } from '@/features/calendar/current-time-indicator'
import { DroppableSlot } from '@/features/calendar/droppable-slot'
import {
	formatHourLabel,
	getPlansForDay,
	HOURS,
	isWorkHour,
	layoutDayPlans,
} from '@/features/calendar/helpers'
import type { IPlan } from '@/features/calendar/interfaces'
import { PlanBlock } from '@/features/calendar/plan-block'
import { cn } from '@/lib/utils'

/** Width of the hour-label gutter. Column headers use it to line up with the grid. */
export const GUTTER_CLASS = 'w-14 shrink-0'

const SLOT_HEIGHT = HOUR_HEIGHT / SLOTS_PER_HOUR

// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

interface IDayColumnProps {
	day: Date
	plans: IPlan[]
	/** Only the leftmost column draws the "now" label, otherwise it repeats per day. */
	showCurrentTimeLabel?: boolean
}

export function DayColumn({ day, plans, showCurrentTimeLabel = false }: IDayColumnProps) {
	const layouts = layoutDayPlans(getPlansForDay(plans, day))

	return (
		<div className="relative flex-1">
			{HOURS.map((hour) => (
				<div
					key={hour}
					className={cn('relative border-b border-border/60', !isWorkHour(hour) && 'bg-muted/40')}
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
						/>
					))}
				</div>
			))}

			{layouts.map((layout) => (
				<PlanBlock key={layout.plan.id} layout={layout} day={day} />
			))}

			{isToday(day) && <CurrentTimeIndicator showLabel={showCurrentTimeLabel} />}
		</div>
	)
}

// ---------------------------------------------------------------------------

/**
 * Scroll container for the time grid. Fills whatever height it is given and opens at
 * the start of the work day instead of at midnight.
 */
export function TimeGridScroller({ children }: { children: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (ref.current) ref.current.scrollTop = WORK_DAY_START_HOUR * HOUR_HEIGHT
	}, [])

	return (
		<div ref={ref} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
			{children}
		</div>
	)
}

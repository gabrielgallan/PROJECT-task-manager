import {
	addDays,
	addMonths,
	addWeeks,
	differenceInDays,
	differenceInMinutes,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	isSameWeek,
	isValid,
	parseISO,
	startOfDay,
	startOfMonth,
	startOfWeek,
	subDays,
	subMonths,
	subWeeks,
} from 'date-fns'
import {
	HOUR_HEIGHT,
	MINUTES_PER_DAY,
	WEEK_STARTS_ON,
	WORK_DAY_END_HOUR,
	WORK_DAY_START_HOUR,
} from '@/features/calendar/constants'
import type { ICalendarCell, IPlan } from '@/features/calendar/interfaces'
import type { TCalendarView } from '@/features/calendar/types'

const RANGE_FORMAT = 'MMM d, yyyy'

const weekOptions = { weekStartsOn: WEEK_STARTS_ON } as const

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export function rangeText(view: TCalendarView, date: Date): string {
	switch (view) {
		case 'day':
			return format(date, 'EEEE, MMM d, yyyy')
		case 'week': {
			const start = startOfWeek(date, weekOptions)
			const end = endOfWeek(date, weekOptions)
			return `${format(start, RANGE_FORMAT)} - ${format(end, RANGE_FORMAT)}`
		}
		case 'month':
		case 'agenda':
			return format(date, 'MMMM yyyy')
	}
}

export function navigateDate(
	date: Date,
	view: TCalendarView,
	direction: 'previous' | 'next',
): Date {
	const operations: Record<TCalendarView, (d: Date, n: number) => Date> = {
		day: direction === 'next' ? addDays : subDays,
		week: direction === 'next' ? addWeeks : subWeeks,
		month: direction === 'next' ? addMonths : subMonths,
		agenda: direction === 'next' ? addMonths : subMonths,
	}

	return operations[view](date, 1)
}

export function getPlansCount(plans: IPlan[], date: Date, view: TCalendarView): number {
	const compareFns: Record<TCalendarView, (d1: Date, d2: Date) => boolean> = {
		day: isSameDay,
		week: (a, b) => isSameWeek(a, b, weekOptions),
		month: isSameMonth,
		agenda: isSameMonth,
	}

	const compareFn = compareFns[view]
	return plans.filter((plan) => compareFn(parseISO(plan.startDate), date)).length
}

// ---------------------------------------------------------------------------
// Time grid
// ---------------------------------------------------------------------------

export function getWeekDays(date: Date, includeWeekends: boolean): Date[] {
	const start = startOfWeek(date, weekOptions)
	return Array.from({ length: includeWeekends ? 7 : 5 }, (_, i) => addDays(start, i))
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function isWorkHour(hour: number): boolean {
	return hour >= WORK_DAY_START_HOUR && hour < WORK_DAY_END_HOUR
}

/** Pixel offset of a given time from midnight. */
export function minutesToOffset(minutes: number): number {
	return (minutes / 60) * HOUR_HEIGHT
}

export function minutesSinceMidnight(date: Date): number {
	return date.getHours() * 60 + date.getMinutes()
}

/**
 * Splits plans into the ones that fit inside a single day (rendered on the time
 * grid) and the ones that span days (rendered on the all-day row).
 */
export function splitPlansBySpan(plans: IPlan[]) {
	const timed: IPlan[] = []
	const multiDay: IPlan[] = []

	for (const plan of plans) {
		const start = parseISO(plan.startDate)
		const end = parseISO(plan.endDate)
		if (!isValid(start) || !isValid(end)) continue
		if (isSameDay(start, end)) timed.push(plan)
		else multiDay.push(plan)
	}

	return { timed, multiDay }
}

export function getPlansForDay(plans: IPlan[], day: Date): IPlan[] {
	return plans.filter((plan) => isSameDay(parseISO(plan.startDate), day))
}

/**
 * Lays overlapping plans out side by side. Returns, for each plan, the column it
 * occupies and how many columns its overlap cluster needs.
 */
export interface IPlanLayout {
	plan: IPlan
	column: number
	columns: number
}

export function layoutDayPlans(dayPlans: IPlan[]): IPlanLayout[] {
	const sorted = [...dayPlans].sort(
		(a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime(),
	)

	const layouts: IPlanLayout[] = []
	let cluster: IPlan[] = []
	let clusterEnd = 0

	const flushCluster = () => {
		if (cluster.length === 0) return

		// Greedy column packing: reuse the first column whose last plan already ended.
		const columnEnds: number[] = []
		for (const plan of cluster) {
			const start = parseISO(plan.startDate).getTime()
			const end = parseISO(plan.endDate).getTime()
			let column = columnEnds.findIndex((columnEnd) => columnEnd <= start)
			if (column === -1) {
				column = columnEnds.length
				columnEnds.push(end)
			} else {
				columnEnds[column] = end
			}
			layouts.push({ plan, column, columns: 0 })
		}

		const columns = columnEnds.length
		for (let i = layouts.length - cluster.length; i < layouts.length; i++) {
			layouts[i].columns = columns
		}

		cluster = []
		clusterEnd = 0
	}

	for (const plan of sorted) {
		const start = parseISO(plan.startDate).getTime()
		const end = parseISO(plan.endDate).getTime()

		if (cluster.length > 0 && start >= clusterEnd) flushCluster()

		cluster.push(plan)
		clusterEnd = Math.max(clusterEnd, end)
	}
	flushCluster()

	return layouts
}

export function getPlanBlockStyle(layout: IPlanLayout, day: Date) {
	const { plan, column, columns } = layout
	const dayStart = startOfDay(day)
	const start = parseISO(plan.startDate)
	const end = parseISO(plan.endDate)

	const startMinutes = Math.max(0, differenceInMinutes(start, dayStart))
	const endMinutes = Math.min(MINUTES_PER_DAY, differenceInMinutes(end, dayStart))
	const durationMinutes = Math.max(15, endMinutes - startMinutes)

	const width = 100 / columns

	return {
		top: `${minutesToOffset(startMinutes)}px`,
		height: `${minutesToOffset(durationMinutes)}px`,
		left: `${column * width}%`,
		width: `${width}%`,
	}
}

// ---------------------------------------------------------------------------
// Month grid
// ---------------------------------------------------------------------------

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
	const monthStart = startOfMonth(selectedDate)
	const gridStart = startOfWeek(monthStart, weekOptions)
	const gridEnd = endOfWeek(endOfMonth(selectedDate), weekOptions)

	return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => ({
		day: date.getDate(),
		currentMonth: isSameMonth(date, selectedDate),
		date,
	}))
}

export function getPlansForCell(date: Date, plans: IPlan[]): IPlan[] {
	const dayStart = startOfDay(date)

	return plans
		.filter((plan) => {
			const start = startOfDay(parseISO(plan.startDate))
			const end = startOfDay(parseISO(plan.endDate))
			return dayStart >= start && dayStart <= end
		})
		.sort((a, b) => {
			const aSpan = differenceInDays(parseISO(a.endDate), parseISO(a.startDate))
			const bSpan = differenceInDays(parseISO(b.endDate), parseISO(b.startDate))
			if (aSpan !== bSpan) return bSpan - aSpan
			return parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
		})
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatTime(date: Date | string, use24HourFormat: boolean): string {
	const parsed = typeof date === 'string' ? parseISO(date) : date
	if (!isValid(parsed)) return ''
	return format(parsed, use24HourFormat ? 'HH:mm' : 'h:mm a')
}

export function formatHourLabel(hour: number, use24HourFormat: boolean): string {
	return format(new Date().setHours(hour, 0, 0, 0), use24HourFormat ? 'HH:mm' : 'h a')
}

export function formatDuration(start: Date, end: Date): string {
	const total = Math.max(0, differenceInMinutes(end, start))
	const hours = Math.floor(total / 60)
	const minutes = total % 60

	if (hours === 0) return `${minutes}m`
	if (minutes === 0) return `${hours}h`
	return `${hours}h ${minutes}m`
}

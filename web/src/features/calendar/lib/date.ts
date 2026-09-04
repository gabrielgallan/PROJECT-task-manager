import {
	addDays,
	addMonths,
	addWeeks,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameMonth,
	startOfDay,
	startOfMonth,
	startOfWeek,
	subDays,
	subMonths,
	subWeeks,
} from 'date-fns'
import { WEEK_STARTS_ON } from '@/features/calendar/constants'
import type { ICalendarCell, ICalendarVisibleRange, TCalendarView } from '@/features/calendar/types'

const RANGE_FORMAT = 'MMM d, yyyy'
const weekOptions = { weekStartsOn: WEEK_STARTS_ON } as const

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
	const operations: Record<TCalendarView, (value: Date, amount: number) => Date> = {
		day: direction === 'next' ? addDays : subDays,
		week: direction === 'next' ? addWeeks : subWeeks,
		month: direction === 'next' ? addMonths : subMonths,
		agenda: direction === 'next' ? addMonths : subMonths,
	}

	return operations[view](date, 1)
}

export function getWeekDays(date: Date, includeWeekends: boolean): Date[] {
	const start = startOfWeek(date, weekOptions)
	return Array.from({ length: includeWeekends ? 7 : 5 }, (_, index) => addDays(start, index))
}

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

export function getVisibleCalendarRange(
	view: TCalendarView,
	selectedDate: Date,
): ICalendarVisibleRange {
	if (view === 'day') {
		const startDate = startOfDay(selectedDate)
		return { view, startDate, endDate: addDays(startDate, 1) }
	}
	if (view === 'week') {
		const startDate = startOfWeek(selectedDate, weekOptions)
		return { view, startDate, endDate: addDays(startDate, 7) }
	}
	const cells = getCalendarCells(selectedDate)
	const startDate = startOfDay(cells[0]?.date ?? selectedDate)
	const endDate = addDays(startOfDay(cells.at(-1)?.date ?? selectedDate), 1)
	return { view, startDate, endDate }
}

import {
	differenceInMinutes,
	endOfWeek,
	isSameDay,
	isSameMonth,
	isWithinInterval,
	parseISO,
	startOfWeek,
	subMinutes,
} from 'date-fns'
import { WEEK_STARTS_ON } from '@/features/calendar/constants'
import type { ICalendarRange, TCalendarView } from '@/features/calendar/types'
import {
	DEFAULT_WORK_LOG_DURATION,
	MIN_WORK_LOG_DURATION,
} from '@/features/work-logs/model/work-log-constants'
import type { IWorkLog } from '@/features/work-logs/model/work-log-types'

const weekOptions = { weekStartsOn: WEEK_STARTS_ON } as const

export function toRange(workLog: IWorkLog): ICalendarRange {
	return {
		startDate: parseISO(workLog.startDate),
		endDate: parseISO(workLog.endDate),
	}
}

export function createWorkLog(input: {
	title: string
	startDate: Date
	endDate: Date
	description?: string
	taskId?: string | null
}): IWorkLog {
	const now = new Date().toISOString()

	return {
		id: crypto.randomUUID(),
		title: input.title,
		description: input.description?.trim() ? input.description : undefined,
		startDate: input.startDate.toISOString(),
		endDate: input.endDate.toISOString(),
		taskId: input.taskId ?? null,
		createdAt: now,
		updatedAt: now,
	}
}

/**
 * Two logs may touch (one ends exactly when the next starts) but never overlap:
 * without that guarantee the sum of durations stops being time actually worked.
 */
export function findOverlap(
	workLogs: IWorkLog[],
	range: ICalendarRange,
	ignoreId?: string,
): IWorkLog | null {
	return (
		workLogs.find((workLog) => {
			if (workLog.id === ignoreId) {
				return false
			}

			const { startDate, endDate } = toRange(workLog)

			return range.startDate < endDate && range.endDate > startDate
		}) ?? null
	)
}

export function isInFuture(range: ICalendarRange): boolean {
	return range.endDate > new Date()
}

export function crossesMidnight(range: ICalendarRange): boolean {
	return !isSameDay(range.startDate, range.endDate)
}

/** The single place that answers "can this interval be recorded?". */
export function validateRange(
	workLogs: IWorkLog[],
	range: ICalendarRange,
	ignoreId?: string,
): string | null {
	if (range.endDate <= range.startDate) {
		return 'End must be after start'
	}

	if (crossesMidnight(range)) {
		return 'A work log must start and end on the same day'
	}

	if (isInFuture(range)) {
		return 'Work logs record time already spent'
	}

	const conflict = findOverlap(workLogs, range, ignoreId)

	if (conflict) {
		return `Overlaps "${conflict.title}"`
	}

	return null
}

export function getLogsForView(
	workLogs: IWorkLog[],
	selectedDate: Date,
	view: TCalendarView,
): IWorkLog[] {
	return workLogs.filter((workLog) => {
		const startDate = parseISO(workLog.startDate)

		switch (view) {
			case 'day':
				return isSameDay(startDate, selectedDate)
			case 'week':
				return isWithinInterval(startDate, {
					start: startOfWeek(selectedDate, weekOptions),
					end: endOfWeek(selectedDate, weekOptions),
				})
			default:
				return isSameMonth(startDate, selectedDate)
		}
	})
}

export function sumMinutes(workLogs: IWorkLog[]): number {
	return workLogs.reduce((total, workLog) => {
		const { startDate, endDate } = toRange(workLog)

		return total + Math.max(0, differenceInMinutes(endDate, startDate))
	}, 0)
}

/**
 * Time left unrecorded between the first and the last log of a day. No working
 * hours are assumed, so a short day never shows a false debt.
 */
export function getUntrackedMinutes(workLogs: IWorkLog[]): number {
	if (workLogs.length < 2) {
		return 0
	}

	const ranges = workLogs.map(toRange)
	const first = Math.min(...ranges.map((range) => range.startDate.getTime()))
	const last = Math.max(...ranges.map((range) => range.endDate.getTime()))
	const span = differenceInMinutes(new Date(last), new Date(first))

	return Math.max(0, span - sumMinutes(workLogs))
}

/**
 * Range for the "Log now" shortcut: from the end of the last log of the day up
 * to now, which is how work is actually recorded — after the fact.
 */
export function getLogNowRange(workLogs: IWorkLog[], now = new Date()): ICalendarRange {
	const todayEnds = workLogs
		.filter((workLog) => isSameDay(parseISO(workLog.startDate), now))
		.map((workLog) => parseISO(workLog.endDate).getTime())
		.filter((time) => time <= now.getTime())

	const lastEnd = todayEnds.length > 0 ? new Date(Math.max(...todayEnds)) : null
	const gap = lastEnd ? differenceInMinutes(now, lastEnd) : 0

	return {
		startDate:
			lastEnd && gap >= MIN_WORK_LOG_DURATION
				? lastEnd
				: subMinutes(now, DEFAULT_WORK_LOG_DURATION),
		endDate: now,
	}
}

export function formatMinutes(total: number): string {
	const hours = Math.floor(total / 60)
	const minutes = total % 60

	if (hours === 0) {
		return `${minutes}m`
	}

	if (minutes === 0) {
		return `${hours}h`
	}

	return `${hours}h ${minutes}m`
}

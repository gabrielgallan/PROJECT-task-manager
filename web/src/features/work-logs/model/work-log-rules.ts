import { Temporal } from '@js-temporal/polyfill'
import { instantToCalendarDate, isValidTimeZone } from '@/features/calendar/lib/time-zone'
import type { ICalendarRange } from '@/features/calendar/types'
import { DEFAULT_WORK_LOG_DURATION } from './work-log-constants'
import type { WorkLog } from './work-log-types'

function durationMinutes(startsAt: string, endsAt: string): number {
	return Math.max(0, Math.floor((Date.parse(endsAt) - Date.parse(startsAt)) / 60_000))
}

function sameCivilDay(startsAt: string, endsAt: string, timeZone: string): boolean {
	const start = Temporal.Instant.from(startsAt).toZonedDateTimeISO(timeZone).toPlainDate()
	const end = Temporal.Instant.from(endsAt).toZonedDateTimeISO(timeZone).toPlainDate()
	return start.equals(end)
}

export function findOverlap(
	workLogs: readonly WorkLog[],
	startsAt: string,
	endsAt: string,
	ignoreId?: string,
): WorkLog | null {
	return (
		workLogs.find(
			(workLog) =>
				workLog.id !== ignoreId &&
				Date.parse(startsAt) < Date.parse(workLog.endsAt) &&
				Date.parse(endsAt) > Date.parse(workLog.startsAt),
		) ?? null
	)
}

export function validateWorkLogInterval(
	workLogs: readonly WorkLog[],
	startsAt: string,
	endsAt: string,
	timeZone: string,
	ignoreId?: string,
	now = new Date().toISOString(),
): string | null {
	if (!isValidTimeZone(timeZone)) return 'Select a valid timezone in Settings.'
	if (Date.parse(endsAt) <= Date.parse(startsAt)) return 'End must be after start.'
	if (!sameCivilDay(startsAt, endsAt, timeZone))
		return 'A work log must start and end on the same day.'
	if (Date.parse(endsAt) > Date.parse(now)) return 'Work logs record time already spent.'
	if (findOverlap(workLogs, startsAt, endsAt, ignoreId))
		return 'This time conflicts with work that is already recorded.'
	return null
}

export function sumMinutes(workLogs: readonly WorkLog[]): number {
	return workLogs.reduce(
		(total, workLog) => total + durationMinutes(workLog.startsAt, workLog.endsAt),
		0,
	)
}

export function getUntrackedMinutes(workLogs: readonly WorkLog[]): number {
	if (workLogs.length < 2) return 0
	const first = Math.min(...workLogs.map((workLog) => Date.parse(workLog.startsAt)))
	const last = Math.max(...workLogs.map((workLog) => Date.parse(workLog.endsAt)))
	return Math.max(0, Math.floor((last - first) / 60_000) - sumMinutes(workLogs))
}

export type LogNowSuggestion =
	| {
			range: ICalendarRange
			original: { startsAt: string; endsAt: string }
			error?: never
	  }
	| { range?: never; error: string }

export function getLogNowSuggestion(
	workLogs: readonly WorkLog[],
	now: string,
	dayStart: string,
	timeZone: string,
): LogNowSuggestion {
	const nowMs = Date.parse(now)
	if (workLogs.some((workLog) => Date.parse(workLog.endsAt) >= nowMs))
		return { error: 'There is no completed free interval ending now.' }

	const previousEnds = workLogs
		.map((workLog) => Date.parse(workLog.endsAt))
		.filter((value) => value < nowMs)
	const fallback = Temporal.Instant.from(now)
		.subtract({ minutes: DEFAULT_WORK_LOG_DURATION })
		.toString()
	const startsAt = previousEnds.length
		? new Date(Math.max(...previousEnds)).toISOString()
		: Date.parse(fallback) < Date.parse(dayStart)
			? dayStart
			: fallback

	if (
		Date.parse(startsAt) >= nowMs ||
		findOverlap(workLogs, startsAt, now) ||
		!sameCivilDay(startsAt, now, timeZone)
	)
		return { error: 'There is no completed free interval ending now.' }

	return {
		range: {
			startDate: instantToCalendarDate(startsAt, timeZone),
			endDate: instantToCalendarDate(now, timeZone),
		},
		original: { startsAt, endsAt: now },
	}
}

export function formatMinutes(total: number): string {
	const hours = Math.floor(total / 60)
	const minutes = total % 60
	if (hours === 0) return `${minutes}m`
	if (minutes === 0) return `${hours}h`
	return `${hours}h ${minutes}m`
}

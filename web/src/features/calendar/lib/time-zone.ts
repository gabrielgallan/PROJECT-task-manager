import { Temporal } from '@js-temporal/polyfill'
import { useCallback, useSyncExternalStore } from 'react'
import type { ICalendarRange } from '@/features/calendar/types'

export const TIME_ZONE_STORAGE_KEY = 'task_manager.timezone'
const UTC = 'UTC'
const CHANGE_EVENT = 'task-manager-time-zone-change'

export function isValidTimeZone(timeZone: string): boolean {
	try {
		Temporal.Now.zonedDateTimeISO(timeZone)
		return true
	} catch {
		return false
	}
}

export function getBrowserTimeZone(): string {
	try {
		const value = Intl.DateTimeFormat().resolvedOptions().timeZone
		return value && isValidTimeZone(value) ? value : UTC
	} catch {
		return UTC
	}
}

export function getTimeZone(): string {
	if (typeof window === 'undefined') return getBrowserTimeZone()
	try {
		const value = window.localStorage.getItem(TIME_ZONE_STORAGE_KEY)
		return value && isValidTimeZone(value) ? value : getBrowserTimeZone()
	} catch {
		return getBrowserTimeZone()
	}
}

export function setTimeZone(timeZone: string): void {
	if (!isValidTimeZone(timeZone) || typeof window === 'undefined') return
	try {
		window.localStorage.setItem(TIME_ZONE_STORAGE_KEY, timeZone)
	} catch {
		/* preference stays usable */
	}
	window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(listener: () => void) {
	if (typeof window === 'undefined') return () => undefined
	const onStorage = (event: StorageEvent) => {
		if (event.key === TIME_ZONE_STORAGE_KEY) listener()
	}
	window.addEventListener(CHANGE_EVENT, listener)
	window.addEventListener('storage', onStorage)
	return () => {
		window.removeEventListener(CHANGE_EVENT, listener)
		window.removeEventListener('storage', onStorage)
	}
}

export function useTimeZone(): [string, (timeZone: string) => void] {
	const value = useSyncExternalStore(subscribe, getTimeZone, getBrowserTimeZone)
	return [value, useCallback((next: string) => setTimeZone(next), [])]
}

function plainFromCalendarDate(date: Date): Temporal.PlainDateTime {
	return new Temporal.PlainDateTime(
		date.getFullYear(),
		date.getMonth() + 1,
		date.getDate(),
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
		date.getMilliseconds(),
	)
}

function sameCivil(left: Temporal.PlainDateTime, right: Temporal.PlainDateTime): boolean {
	return left.equals(right)
}

export class InvalidCalendarTimeError extends Error {
	readonly boundary?: 'start' | 'end'
	constructor(boundary?: 'start' | 'end') {
		super('This time does not exist in the selected timezone.')
		this.boundary = boundary
	}
}

export interface CalendarInstantResult {
	iso: string
	ambiguous: boolean
}

export function calendarDateToInstant(
	date: Date,
	timeZone: string,
	options: { original?: string } = {},
): CalendarInstantResult {
	const plain = plainFromCalendarDate(date)
	const earlier = plain.toZonedDateTime(timeZone, { disambiguation: 'earlier' })
	const later = plain.toZonedDateTime(timeZone, { disambiguation: 'later' })
	const earlierMatches = sameCivil(earlier.toPlainDateTime(), plain)
	const laterMatches = sameCivil(later.toPlainDateTime(), plain)
	if (!earlierMatches && !laterMatches) throw new InvalidCalendarTimeError()
	const ambiguous = earlierMatches && laterMatches && !earlier.toInstant().equals(later.toInstant())
	if (options.original) {
		const original = Temporal.Instant.from(options.original).toZonedDateTimeISO(timeZone)
		if (sameCivil(original.toPlainDateTime(), plain)) return { iso: options.original, ambiguous }
	}
	return { iso: (earlierMatches ? earlier : later).toInstant().toString(), ambiguous }
}

export function instantToCalendarDate(iso: string, timeZone: string): Date {
	const value = Temporal.Instant.from(iso).toZonedDateTimeISO(timeZone)
	return new Date(
		value.year,
		value.month - 1,
		value.day,
		value.hour,
		value.minute,
		value.second,
		value.millisecond,
	)
}

export function instantToCalendarText(iso: string, timeZone: string): string {
	const value = Temporal.Instant.from(iso).toZonedDateTimeISO(timeZone).toPlainDateTime()
	return value.toString({ smallestUnit: 'millisecond' })
}

export function calendarRangeToIso(
	range: ICalendarRange,
	timeZone: string,
	original?: { startsAt?: string; endsAt?: string },
) {
	let start: CalendarInstantResult
	let end: CalendarInstantResult
	try {
		start = calendarDateToInstant(range.startDate, timeZone, { original: original?.startsAt })
	} catch (error) {
		if (error instanceof InvalidCalendarTimeError) throw new InvalidCalendarTimeError('start')
		throw error
	}
	try {
		end = calendarDateToInstant(range.endDate, timeZone, { original: original?.endsAt })
	} catch (error) {
		if (error instanceof InvalidCalendarTimeError) throw new InvalidCalendarTimeError('end')
		throw error
	}
	if (Temporal.Instant.compare(start.iso, end.iso) >= 0) throw new Error('End must be after start')
	return {
		startsAt: start.iso,
		endsAt: end.iso,
		ambiguousStart: start.ambiguous,
		ambiguousEnd: end.ambiguous,
	}
}

export function calendarDayStartToInstant(date: Date, timeZone: string): string {
	const plainDate = Temporal.PlainDate.from({
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate(),
	})
	return plainDate
		.toPlainDateTime()
		.toZonedDateTime(timeZone, {
			disambiguation: 'compatible',
		})
		.toInstant()
		.toString()
}

export function getZonedToday(timeZone: string): Date {
	const today = Temporal.Now.plainDateISO(timeZone)
	return new Date(today.year, today.month - 1, today.day)
}

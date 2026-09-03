import { format, isValid } from 'date-fns'
import type { DateOnly } from './task-api-types'

/** Task dates are calendar days, even though the API serializes midnight UTC. */
export function taskDateToLocal(value: string | null): Date | undefined {
	if (!value) return undefined
	const [year, month, day] = value.slice(0, 10).split('-').map(Number)
	const date = new Date(0)
	date.setFullYear(year, month - 1, day)
	date.setHours(0, 0, 0, 0)
	return date
}

export function localToTaskDate(value: Date | undefined): DateOnly | null {
	if (!value) return null
	return isValid(value) ? format(value, 'yyyy-MM-dd') : 'invalid-date'
}

import { differenceInMinutes, format, isValid, parseISO } from 'date-fns'

export function formatTime(date: Date | string, use24HourFormat: boolean): string {
	const parsed = typeof date === 'string' ? parseISO(date) : date
	if (!isValid(parsed)) return ''
	return format(parsed, use24HourFormat ? 'HH:mm' : 'h:mm a')
}

export function formatHourLabel(hour: number, use24HourFormat: boolean): string {
	return format(new Date().setHours(hour, 0, 0, 0), use24HourFormat ? 'HH:mm' : 'h a')
}

export function formatMinutes(total: number): string {
	const hours = Math.floor(total / 60)
	const minutes = total % 60

	if (hours === 0) return `${minutes}m`
	if (minutes === 0) return `${hours}h`
	return `${hours}h ${minutes}m`
}

export function formatDuration(start: Date, end: Date): string {
	return formatMinutes(Math.max(0, differenceInMinutes(end, start)))
}

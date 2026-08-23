export function isValidTimeZone(timeZone: string) {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone }).format()

		return true
	} catch {
		return false
	}
}

function getCalendarDateKey(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date)

	const year = parts.find((part) => part.type === 'year')?.value
	const month = parts.find((part) => part.type === 'month')?.value
	const day = parts.find((part) => part.type === 'day')?.value

	return `${year}-${month}-${day}`
}

export function isSameCalendarDay(dateA: Date, dateB: Date, timeZone: string) {
	return getCalendarDateKey(dateA, timeZone) === getCalendarDateKey(dateB, timeZone)
}

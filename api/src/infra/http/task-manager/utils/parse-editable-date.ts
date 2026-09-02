/**
 * Keeps the three-state contract of an editable date: `undefined` leaves the
 * current value untouched, `null` clears it, and a date string replaces it.
 */
export function parseEditableDate(date?: string | null): Date | null | undefined {
	if (date === undefined) return undefined

	if (date === null) return null

	return new Date(date)
}

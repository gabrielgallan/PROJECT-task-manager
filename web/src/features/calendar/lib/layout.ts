import { differenceInDays, isSameDay, isValid, parseISO, startOfDay } from 'date-fns'
import type { ICalendarItem, ICalendarRange } from '@/features/calendar/types'

export interface ICalendarItemLayout<TItem extends ICalendarItem> {
	item: TItem
	column: number
	columns: number
}

export function splitItemsBySpan<TItem extends ICalendarItem>(items: TItem[]) {
	const timed: TItem[] = []
	const multiDay: TItem[] = []

	for (const item of items) {
		const start = parseISO(item.startDate)
		const end = parseISO(item.endDate)
		if (!isValid(start) || !isValid(end)) continue
		if (isSameDay(start, end)) timed.push(item)
		else multiDay.push(item)
	}

	return { timed, multiDay }
}

export function getItemsForDay<TItem extends ICalendarItem>(items: TItem[], day: Date): TItem[] {
	return items.filter((item) => isSameDay(parseISO(item.startDate), day))
}

export function layoutDayItems<TItem extends ICalendarItem>(
	dayItems: TItem[],
): ICalendarItemLayout<TItem>[] {
	const sorted = [...dayItems].sort(
		(a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime(),
	)
	const layouts: ICalendarItemLayout<TItem>[] = []
	let cluster: TItem[] = []
	let clusterEnd = 0

	const flushCluster = () => {
		if (cluster.length === 0) return

		const columnEnds: number[] = []
		for (const item of cluster) {
			const start = parseISO(item.startDate).getTime()
			const end = parseISO(item.endDate).getTime()
			let column = columnEnds.findIndex((columnEnd) => columnEnd <= start)
			if (column === -1) {
				column = columnEnds.length
				columnEnds.push(end)
			} else {
				columnEnds[column] = end
			}
			layouts.push({ item, column, columns: 0 })
		}

		const columns = columnEnds.length
		for (let index = layouts.length - cluster.length; index < layouts.length; index += 1) {
			layouts[index].columns = columns
		}

		cluster = []
		clusterEnd = 0
	}

	for (const item of sorted) {
		const start = parseISO(item.startDate).getTime()
		const end = parseISO(item.endDate).getTime()

		if (cluster.length > 0 && start >= clusterEnd) flushCluster()
		cluster.push(item)
		clusterEnd = Math.max(clusterEnd, end)
	}
	flushCluster()

	return layouts
}

export function getItemsForCell<TItem extends ICalendarItem>(
	date: Date,
	items: TItem[],
): TItem[] {
	const dayStart = startOfDay(date)

	return items
		.filter((item) => {
			const start = startOfDay(parseISO(item.startDate))
			const end = startOfDay(parseISO(item.endDate))
			return dayStart >= start && dayStart <= end
		})
		.sort((a, b) => {
			const aSpan = differenceInDays(parseISO(a.endDate), parseISO(a.startDate))
			const bSpan = differenceInDays(parseISO(b.endDate), parseISO(b.startDate))
			if (aSpan !== bSpan) return bSpan - aSpan
			return parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
		})
}

export function moveItemTo<TItem extends ICalendarItem>(
	item: TItem,
	targetDate: Date,
	hour?: number,
	minute?: number,
): ICalendarRange {
	const originalStart = new Date(item.startDate)
	const originalEnd = new Date(item.endDate)
	const duration = originalEnd.getTime() - originalStart.getTime()
	const startDate = new Date(targetDate)

	if (hour !== undefined) {
		startDate.setHours(hour, minute ?? 0, 0, 0)
	} else {
		startDate.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0)
	}

	return {
		startDate,
		endDate: new Date(startDate.getTime() + duration),
	}
}

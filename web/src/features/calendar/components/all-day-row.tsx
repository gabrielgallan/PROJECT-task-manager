import { differenceInCalendarDays, endOfDay, parseISO, startOfDay } from 'date-fns'
import { useMemo } from 'react'
import type { ICalendarItem, ICalendarProps } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

interface IRowItem<TItem extends ICalendarItem> {
	item: TItem
	startIndex: number
	span: number
}

type TAllDayRowProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	'onOpen' | 'renderItem' | 'getItemClassName'
> & {
	days: Date[]
	items: TItem[]
}

export function AllDayRow<TItem extends ICalendarItem>({
	days,
	items,
	onOpen,
	renderItem,
	getItemClassName,
}: TAllDayRowProps<TItem>) {
	const rows = useMemo(() => {
		if (days.length === 0) return []

		const rangeStart = startOfDay(days[0])
		const rangeEnd = endOfDay(days[days.length - 1])
		const rowItems: IRowItem<TItem>[] = items
			.filter((item) => parseISO(item.startDate) <= rangeEnd && parseISO(item.endDate) >= rangeStart)
			.map((item) => {
				const start = parseISO(item.startDate)
				const end = parseISO(item.endDate)
				const startIndex = differenceInCalendarDays(start < rangeStart ? rangeStart : start, rangeStart)
				const endIndex = differenceInCalendarDays(end > rangeEnd ? rangeEnd : end, rangeStart)
				return { item, startIndex, span: endIndex - startIndex + 1 }
			})
			.sort((a, b) => a.startIndex - b.startIndex || b.span - a.span)

		const packed: IRowItem<TItem>[][] = []
		for (const item of rowItems) {
			const row = packed.find((candidate) =>
				candidate.every(
					(placed) =>
						placed.startIndex + placed.span <= item.startIndex ||
						item.startIndex + item.span <= placed.startIndex,
				),
			)
			if (row) row.push(item)
			else packed.push([item])
		}

		return packed
	}, [days, items])

	if (rows.length === 0) return null

	return (
		<div className="flex flex-col gap-px py-1">
			{rows.map((row, rowIndex) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional, not identities
				<div
					key={rowIndex}
					className="grid gap-px"
					style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
				>
					{row.map(({ item, startIndex, span }) => {
						const context = {
							variant: 'all-day' as const,
							startDate: parseISO(item.startDate),
							endDate: parseISO(item.endDate),
							isCompact: false,
						}

						return (
							<button
								key={item.id}
								type="button"
								onClick={() => onOpen?.(item)}
								style={{ gridColumn: `${startIndex + 1} / span ${span}` }}
								className={cn(
									'truncate rounded border border-l-4 border-transparent px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors',
									getItemClassName?.(item, context),
								)}
							>
								{renderItem(item, context)}
							</button>
						)
					})}
				</div>
			))}
		</div>
	)
}

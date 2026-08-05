import { format, isSameMonth, isToday, parseISO } from 'date-fns'
import { CalendarOff } from 'lucide-react'
import { useMemo } from 'react'
import { useCalendar } from '@/features/calendar/calendar-provider'
import type { ICalendarItem, ICalendarProps } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

type TAgendaViewProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	'items' | 'onOpen' | 'renderItem' | 'getItemClassName'
> & {
	getEmptyText?: (selectedDate: Date) => string
}

export function CalendarAgendaView<TItem extends ICalendarItem>({
	items,
	onOpen,
	renderItem,
	getItemClassName,
	getEmptyText,
}: TAgendaViewProps<TItem>) {
	const { selectedDate } = useCalendar()
	const groups = useMemo(() => {
		const monthItems = items
			.filter((item) => isSameMonth(parseISO(item.startDate), selectedDate))
			.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
		const byDay = new Map<string, TItem[]>()

		for (const item of monthItems) {
			const key = format(parseISO(item.startDate), 'yyyy-MM-dd')
			const bucket = byDay.get(key)
			if (bucket) bucket.push(item)
			else byDay.set(key, [item])
		}

		return [...byDay.entries()]
	}, [items, selectedDate])

	if (groups.length === 0) {
		return (
			<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
				<CalendarOff className="size-6" />
				<p className="text-sm">
					{getEmptyText?.(selectedDate) ?? `No items for ${format(selectedDate, 'MMMM yyyy')}.`}
				</p>
			</div>
		)
	}

	return (
		<div className="calendar-scrollbar min-h-0 flex-1 overflow-y-auto">
			<div className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
				{groups.map(([key, dayItems]) => {
					const day = parseISO(key)

					return (
						<section key={key} className="flex gap-4">
							<div className="w-14 shrink-0 pt-1 text-right">
								<p className="text-[11px] uppercase text-muted-foreground">{format(day, 'EEE')}</p>
								<p
									className={cn(
										'text-lg font-semibold tabular-nums',
										isToday(day) && 'text-primary',
									)}
								>
									{format(day, 'd')}
								</p>
							</div>

							<div className="flex flex-1 flex-col gap-1.5">
								{dayItems.map((item) => {
									const context = {
										variant: 'agenda' as const,
										startDate: parseISO(item.startDate),
										endDate: parseISO(item.endDate),
										isCompact: false,
									}

									return (
										<button
											key={item.id}
											type="button"
											onClick={() => onOpen?.(item)}
											className={cn(
												'flex flex-col gap-0.5 rounded-xs border border-l-4 border-transparent px-3 py-2 text-left transition-colors',
												getItemClassName?.(item, context),
											)}
										>
											{renderItem(item, context)}
										</button>
									)
								})}
							</div>
						</section>
					)
				})}
			</div>
		</div>
	)
}

import { isToday, parseISO, set } from 'date-fns'
import { useState } from 'react'
import { useCalendar } from '@/features/calendar/calendar-provider'
import { SLOT_MINUTES, WORK_DAY_START_HOUR } from '@/features/calendar/constants'
import { useDragDrop } from '@/features/calendar/interactions/drag-drop-context'
import { getItemsForCell, moveItemTo } from '@/features/calendar/lib/layout'
import type { ICalendarCell, ICalendarItem, ICalendarProps } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

const MAX_VISIBLE = 3

type TMonthCellProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	'onCreate' | 'onOpen' | 'onMove' | 'renderItem' | 'getItemClassName'
> & {
	cell: ICalendarCell
	items: TItem[]
}

export function MonthCell<TItem extends ICalendarItem>({
	cell,
	items,
	onCreate,
	onOpen,
	onMove,
	renderItem,
	getItemClassName,
}: TMonthCellProps<TItem>) {
	const { date, day, currentMonth } = cell
	const { setSelectedDate, setView } = useCalendar()
	const { activeItemId, startDrag, endDrag } = useDragDrop()
	const [isOver, setIsOver] = useState(false)
	const cellItems = getItemsForCell(date, items)
	const visible = cellItems.slice(0, MAX_VISIBLE)
	const hiddenCount = cellItems.length - visible.length

	const openDay = () => {
		setSelectedDate(date)
		setView('day')
	}

	const createItem = () => {
		const startDate = set(date, {
			hours: WORK_DAY_START_HOUR,
			minutes: 0,
			seconds: 0,
			milliseconds: 0,
		})
		onCreate?.({ startDate, endDate: new Date(startDate.getTime() + SLOT_MINUTES * 60_000) })
	}

	return (
		<div
			className={cn(
				'group flex min-h-28 flex-col gap-0.5 border-r border-b p-1 transition-colors',
				!currentMonth && 'bg-muted/30',
				isOver && 'bg-primary/10',
			)}
			onDragOver={(event) => {
				event.preventDefault()
				if (!isOver) setIsOver(true)
			}}
			onDragLeave={() => setIsOver(false)}
			onDrop={(event) => {
				event.preventDefault()
				setIsOver(false)
				const item = items.find((candidate) => candidate.id === activeItemId)
				if (!item) return
				const range = moveItemTo(item, date)
				if (range.startDate.getTime() !== new Date(item.startDate).getTime()) onMove?.(item, range)
				endDrag()
			}}
		>
			<div className="flex items-center justify-between">
				<span
					className={cn(
						'flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums',
						!currentMonth && 'text-muted-foreground/60',
						isToday(date) && 'bg-primary font-semibold text-primary-foreground',
					)}
				>
					{day}
				</span>

				<button
					type="button"
					aria-label="Add an item"
					onClick={createItem}
					className="rounded px-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
				>
					+
				</button>
			</div>

			<div className="flex flex-col gap-px">
				{visible.map((item) => {
					const context = {
						variant: 'month' as const,
						startDate: parseISO(item.startDate),
						endDate: parseISO(item.endDate),
						isCompact: true,
					}

					return (
						<button
							key={item.id}
							type="button"
							draggable={Boolean(onMove)}
							onDragStart={(event) => {
								event.dataTransfer.effectAllowed = 'move'
								event.dataTransfer.setData('text/plain', item.id)
								startDrag(item.id)
							}}
							onDragEnd={endDrag}
							onClick={(event) => {
								event.stopPropagation()
								onOpen?.(item)
							}}
							className={cn(
								'flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] transition-colors hover:bg-accent',
								getItemClassName?.(item, context),
							)}
						>
							{renderItem(item, context)}
						</button>
					)
				})}

				{hiddenCount > 0 && (
					<button
						type="button"
						onClick={openDay}
						className="px-1 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
					>
						+{hiddenCount} more
					</button>
				)}
			</div>
		</div>
	)
}

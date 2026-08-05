import { differenceInMinutes, parseISO } from 'date-fns'
import { useCallback, useRef, useState } from 'react'
import { HOUR_HEIGHT, MINUTES_PER_DAY } from '@/features/calendar/constants'
import { useDragDrop } from '@/features/calendar/interactions/drag-drop-context'
import type { ICalendarItemLayout } from '@/features/calendar/lib/layout'
import type {
	ICalendarItem,
	ICalendarItemRenderContext,
	ICalendarProps,
} from '@/features/calendar/types'
import { cn } from '@/lib/utils'

const SNAP_MINUTES = 15
const MIN_DURATION_MINUTES = 15
const COMPACT_HEIGHT = 34

type TTimeItemProps<TItem extends ICalendarItem> = Pick<
	ICalendarProps<TItem>,
	'onOpen' | 'onMove' | 'onResize' | 'renderItem' | 'getItemClassName'
> & {
	layout: ICalendarItemLayout<TItem>
	day: Date
}

type TEdge = 'top' | 'bottom'

export function TimeItem<TItem extends ICalendarItem>({
	layout,
	day,
	onOpen,
	onMove,
	onResize,
	renderItem,
	getItemClassName,
}: TTimeItemProps<TItem>) {
	const { item, column, columns } = layout
	const { startDrag, endDrag, isDragging, activeItemId } = useDragDrop()
	const [resizeOffset, setResizeOffset] = useState<{ top: number; bottom: number } | null>(null)
	const dragMovedRef = useRef(false)
	const start = parseISO(item.startDate)
	const end = parseISO(item.endDate)
	const dayStart = new Date(day)
	dayStart.setHours(0, 0, 0, 0)

	const baseStartMinutes = Math.max(0, differenceInMinutes(start, dayStart))
	const baseEndMinutes = Math.min(MINUTES_PER_DAY, differenceInMinutes(end, dayStart))
	const startMinutes = baseStartMinutes + (resizeOffset?.top ?? 0)
	const endMinutes = baseEndMinutes + (resizeOffset?.bottom ?? 0)
	const durationMinutes = endMinutes - startMinutes
	const width = 100 / columns
	const heightPx = (durationMinutes / 60) * HOUR_HEIGHT
	const isCompact = heightPx < COMPACT_HEIGHT
	const isBeingDragged = isDragging && activeItemId === item.id
	const previewStart = new Date(dayStart.getTime() + startMinutes * 60_000)
	const previewEnd = new Date(dayStart.getTime() + endMinutes * 60_000)
	const renderContext: ICalendarItemRenderContext = {
		variant: 'time',
		startDate: previewStart,
		endDate: previewEnd,
		isCompact,
	}

	const handleResizeStart = useCallback(
		(edge: TEdge) => (event: React.PointerEvent<HTMLElement>) => {
			event.preventDefault()
			event.stopPropagation()
			if (!onResize) return

			const originY = event.clientY
			let offset = { top: 0, bottom: 0 }

			const handleMove = (moveEvent: PointerEvent) => {
				const deltaMinutes =
					Math.round((((moveEvent.clientY - originY) / HOUR_HEIGHT) * 60) / SNAP_MINUTES) *
					SNAP_MINUTES

				if (edge === 'top') {
					const maxDelta = baseEndMinutes - baseStartMinutes - MIN_DURATION_MINUTES
					offset = { top: Math.min(Math.max(deltaMinutes, -baseStartMinutes), maxDelta), bottom: 0 }
				} else {
					const minDelta = MIN_DURATION_MINUTES - (baseEndMinutes - baseStartMinutes)
					offset = {
						top: 0,
						bottom: Math.max(Math.min(deltaMinutes, MINUTES_PER_DAY - baseEndMinutes), minDelta),
					}
				}

				setResizeOffset(offset)
			}

			const handleUp = () => {
				window.removeEventListener('pointermove', handleMove)
				window.removeEventListener('pointerup', handleUp)
				setResizeOffset(null)
				if (offset.top === 0 && offset.bottom === 0) return

				onResize(item, {
					startDate: new Date(dayStart.getTime() + (baseStartMinutes + offset.top) * 60_000),
					endDate: new Date(dayStart.getTime() + (baseEndMinutes + offset.bottom) * 60_000),
				})
			}

			window.addEventListener('pointermove', handleMove)
			window.addEventListener('pointerup', handleUp)
		},
		[baseStartMinutes, baseEndMinutes, dayStart, item, onResize],
	)

	const isResizing = resizeOffset !== null

	return (
		<div
			className="absolute px-0.5"
			style={{
				top: `${(startMinutes / 60) * HOUR_HEIGHT}px`,
				height: `${heightPx}px`,
				left: `${column * width}%`,
				width: `${width}%`,
			}}
		>
			<button
				type="button"
				draggable={Boolean(onMove) && !isResizing}
				onDragStart={(event) => {
					if (!onMove) return
					dragMovedRef.current = true
					event.dataTransfer.effectAllowed = 'move'
					event.dataTransfer.setData('text/plain', item.id)
					startDrag(item.id)
				}}
				onDragEnd={() => {
					endDrag()
					window.setTimeout(() => {
						dragMovedRef.current = false
					}, 0)
				}}
				onClick={() => {
					if (!dragMovedRef.current && !isResizing) onOpen?.(item)
				}}
				className={cn(
					'group relative flex size-full cursor-pointer select-none flex-col justify-start overflow-hidden rounded-xs border border-l-4 border-transparent px-2 py-1 text-left text-xs transition-colors',
					'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					getItemClassName?.(item, renderContext),
					isCompact && 'flex-row items-center gap-1.5 py-0',
					isBeingDragged && 'opacity-40',
					isResizing && 'ring-2 ring-ring',
				)}
			>
				{renderItem(item, renderContext)}

				{onResize && (
					<>
						<span
							role="presentation"
							onPointerDown={handleResizeStart('top')}
							className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100"
						/>
						<span
							role="presentation"
							onPointerDown={handleResizeStart('bottom')}
							className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100"
						/>
					</>
				)}
			</button>
		</div>
	)
}

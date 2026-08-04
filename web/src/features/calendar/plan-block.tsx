import { differenceInMinutes, parseISO } from 'date-fns'
import { useCallback, useRef, useState } from 'react'
import { PLAN_SURFACE } from '@/features/calendar/colors'
import { HOUR_HEIGHT, MINUTES_PER_DAY } from '@/features/calendar/constants'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { useDragDrop } from '@/features/calendar/contexts/dnd-context'
import { formatTime, type IPlanLayout } from '@/features/calendar/helpers'
import { cn } from '@/lib/utils'

/** Resizing snaps to this many minutes. */
const SNAP_MINUTES = 15
const MIN_DURATION_MINUTES = 15

/** Below this height the block only has room for the title. */
const COMPACT_HEIGHT = 34

interface IProps {
	layout: IPlanLayout
	day: Date
}

type TEdge = 'top' | 'bottom'

export function PlanBlock({ layout, day }: IProps) {
	const { plan, column, columns } = layout
	const { use24HourFormat, openEditPlan, updatePlan } = useCalendar()
	const { startDrag, endDrag, isDragging, draggedPlan } = useDragDrop()

	const [resizeOffset, setResizeOffset] = useState<{ top: number; bottom: number } | null>(null)
	const dragMovedRef = useRef(false)

	const start = parseISO(plan.startDate)
	const end = parseISO(plan.endDate)

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
	const isBeingDragged = isDragging && draggedPlan?.id === plan.id

	const previewStart = new Date(dayStart.getTime() + startMinutes * 60_000)
	const previewEnd = new Date(dayStart.getTime() + endMinutes * 60_000)

	const handleResizeStart = useCallback(
		(edge: TEdge) => (event: React.PointerEvent<HTMLElement>) => {
			event.preventDefault()
			event.stopPropagation()

			const originY = event.clientY
			let offset = { top: 0, bottom: 0 }

			const handleMove = (moveEvent: PointerEvent) => {
				const deltaMinutes =
					Math.round((((moveEvent.clientY - originY) / HOUR_HEIGHT) * 60) / SNAP_MINUTES) *
					SNAP_MINUTES

				if (edge === 'top') {
					const maxDelta = baseEndMinutes - baseStartMinutes - MIN_DURATION_MINUTES
					const clamped = Math.min(Math.max(deltaMinutes, -baseStartMinutes), maxDelta)
					offset = { top: clamped, bottom: 0 }
				} else {
					const minDelta = MIN_DURATION_MINUTES - (baseEndMinutes - baseStartMinutes)
					const clamped = Math.max(
						Math.min(deltaMinutes, MINUTES_PER_DAY - baseEndMinutes),
						minDelta,
					)
					offset = { top: 0, bottom: clamped }
				}

				setResizeOffset(offset)
			}

			const handleUp = () => {
				window.removeEventListener('pointermove', handleMove)
				window.removeEventListener('pointerup', handleUp)
				setResizeOffset(null)

				if (offset.top === 0 && offset.bottom === 0) return

				updatePlan({
					...plan,
					startDate: new Date(
						dayStart.getTime() + (baseStartMinutes + offset.top) * 60_000,
					).toISOString(),
					endDate: new Date(
						dayStart.getTime() + (baseEndMinutes + offset.bottom) * 60_000,
					).toISOString(),
				})
			}

			window.addEventListener('pointermove', handleMove)
			window.addEventListener('pointerup', handleUp)
		},
		[baseStartMinutes, baseEndMinutes, dayStart, plan, updatePlan],
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
				draggable={!isResizing}
				onDragStart={(event) => {
					dragMovedRef.current = true
					event.dataTransfer.effectAllowed = 'move'
					event.dataTransfer.setData('text/plain', plan.id)
					startDrag(plan)
				}}
				onDragEnd={() => {
					endDrag()
					// Let the click that follows the drag be swallowed.
					window.setTimeout(() => {
						dragMovedRef.current = false
					}, 0)
				}}
				onClick={() => {
					if (dragMovedRef.current || isResizing) return
					openEditPlan(plan)
				}}
				className={cn(
					'group relative flex size-full cursor-pointer select-none flex-col justify-start overflow-hidden rounded-xs border border-l-4 border-transparent px-2 py-1 text-left text-xs transition-colors',
					'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					PLAN_SURFACE[plan.color],
					isCompact && 'flex-row items-center gap-1.5 py-0',
					isBeingDragged && 'opacity-40',
					isResizing && 'ring-2 ring-ring',
				)}
			>
				<span className="truncate font-medium leading-tight">{plan.title}</span>
				<span className={cn('truncate leading-tight opacity-70', isCompact && 'shrink-0')}>
					{formatTime(previewStart, use24HourFormat)}
					{!isCompact && ` – ${formatTime(previewEnd, use24HourFormat)}`}
				</span>

				{/* Resize handles. Hidden until hover so the grid stays calm. */}
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
			</button>
		</div>
	)
}

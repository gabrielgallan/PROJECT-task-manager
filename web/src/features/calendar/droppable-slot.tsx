import { set } from 'date-fns'
import { Plus } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { useDragDrop } from '@/features/calendar/contexts/dnd-context'
import { cn } from '@/lib/utils'

interface IProps {
	day: Date
	hour: number
	minute: number
	style?: CSSProperties
}

/**
 * One clickable / droppable slice of the time grid. Deliberately cheap: it holds no
 * form state, it only tells the calendar what the user pointed at.
 */
export function DroppableSlot({ day, hour, minute, style }: IProps) {
	const { openCreatePlan } = useCalendar()
	const { dropOn, isDragging } = useDragDrop()
	const [isOver, setIsOver] = useState(false)

	const label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

	return (
		<button
			type="button"
			aria-label={`Add a plan at ${label}`}
			style={style}
			className={cn(
				'group absolute inset-x-0 flex items-center justify-center transition-colors',
				'hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
				isOver && 'bg-primary/15',
			)}
			onClick={() =>
				openCreatePlan(set(day, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 }))
			}
			onDragOver={(event) => {
				event.preventDefault()
				if (!isOver) setIsOver(true)
			}}
			onDragLeave={() => setIsOver(false)}
			onDrop={(event) => {
				event.preventDefault()
				setIsOver(false)
				dropOn(day, hour, minute)
			}}
		>
			{!isDragging && (
				<Plus className="size-3 opacity-0 transition-opacity group-hover:opacity-40" />
			)}
		</button>
	)
}

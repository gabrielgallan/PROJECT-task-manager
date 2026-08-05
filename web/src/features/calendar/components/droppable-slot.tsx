import { set } from 'date-fns'
import { Plus } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { SLOT_MINUTES } from '@/features/calendar/constants'
import { useDragDrop } from '@/features/calendar/interactions/drag-drop-context'
import type { ICalendarRange } from '@/features/calendar/types'
import { cn } from '@/lib/utils'

interface IProps {
	day: Date
	hour: number
	minute: number
	style?: CSSProperties
	onCreate?: (range: ICalendarRange) => void
	onDropItem: (day: Date, hour: number, minute: number) => void
}

export function DroppableSlot({ day, hour, minute, style, onCreate, onDropItem }: IProps) {
	const { isDragging } = useDragDrop()
	const [isOver, setIsOver] = useState(false)
	const label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

	const createItem = () => {
		const startDate = set(day, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 })
		onCreate?.({ startDate, endDate: new Date(startDate.getTime() + SLOT_MINUTES * 60_000) })
	}

	return (
		<button
			type="button"
			aria-label={`Add an item at ${label}`}
			style={style}
			className={cn(
				'group absolute inset-x-0 flex items-center justify-center transition-colors',
				'hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
				isOver && 'bg-primary/15',
			)}
			onClick={createItem}
			onDragOver={(event) => {
				event.preventDefault()
				if (!isOver) setIsOver(true)
			}}
			onDragLeave={() => setIsOver(false)}
			onDrop={(event) => {
				event.preventDefault()
				setIsOver(false)
				onDropItem(day, hour, minute)
			}}
		>
			{!isDragging && <Plus className="size-3 opacity-0 transition-opacity group-hover:opacity-40" />}
		</button>
	)
}

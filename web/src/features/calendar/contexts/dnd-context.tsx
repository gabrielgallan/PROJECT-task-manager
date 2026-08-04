import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import type { IPlan } from '@/features/calendar/interfaces'

interface IDragDropContext {
	draggedPlan: IPlan | null
	isDragging: boolean
	startDrag: (plan: IPlan) => void
	endDrag: () => void
	dropOn: (date: Date, hour?: number, minute?: number) => void
}

const DragDropContext = createContext<IDragDropContext | null>(null)

export function DndProvider({ children }: { children: ReactNode }) {
	const { updatePlan } = useCalendar()
	const [draggedPlan, setDraggedPlan] = useState<IPlan | null>(null)

	const startDrag = useCallback((plan: IPlan) => setDraggedPlan(plan), [])
	const endDrag = useCallback(() => setDraggedPlan(null), [])

	const dropOn = useCallback(
		(targetDate: Date, hour?: number, minute?: number) => {
			if (!draggedPlan) return

			const originalStart = new Date(draggedPlan.startDate)
			const originalEnd = new Date(draggedPlan.endDate)
			const duration = originalEnd.getTime() - originalStart.getTime()

			const newStart = new Date(targetDate)
			if (hour !== undefined) {
				newStart.setHours(hour, minute ?? 0, 0, 0)
			} else {
				newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0)
			}

			if (newStart.getTime() !== originalStart.getTime()) {
				updatePlan({
					...draggedPlan,
					startDate: newStart.toISOString(),
					endDate: new Date(newStart.getTime() + duration).toISOString(),
				})
			}

			endDrag()
		},
		[draggedPlan, updatePlan, endDrag],
	)

	const value = useMemo<IDragDropContext>(
		() => ({ draggedPlan, isDragging: draggedPlan !== null, startDrag, endDrag, dropOn }),
		[draggedPlan, startDrag, endDrag, dropOn],
	)

	return <DragDropContext.Provider value={value}>{children}</DragDropContext.Provider>
}

export function useDragDrop(): IDragDropContext {
	const context = useContext(DragDropContext)
	if (!context) throw new Error('useDragDrop must be used within a DndProvider.')
	return context
}

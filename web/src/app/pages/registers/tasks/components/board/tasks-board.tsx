import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { MouseEvent, TouchEvent } from 'react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { TaskBoardCard } from '@/app/pages/registers/tasks/components/board/task-board-card'
import { TasksEmptyState } from '@/app/pages/registers/tasks/components/list/tasks-empty-state'
import { KanbanBoard, KanbanCards, KanbanHeader, KanbanProvider } from '@/components/kibo-ui/kanban'
import { Button } from '@/components/ui/button'
import {
	buildTaskBoard,
	type TaskBoardColumn,
	type TaskBoardCard as TBoardCard,
} from '@/features/tasks/model/task-board'
import {
	TASK_STATUS_ICON,
	TASK_STATUS_ICON_COLOR,
	TASK_STATUS_LABEL,
	TASK_STATUSES,
} from '@/features/tasks/model/task-status'
import { canTransitionTask, describeTaskTransitions } from '@/features/tasks/model/task-transitions'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

/** Where a card is being held while the pointer is still down. */
interface IDragState {
	id: string
	column: TaskStatus
}

/**
 * The whole card is the drag handle, so anything that has its own press has to
 * opt out — otherwise opening the actions menu would start a drag instead.
 */
function isDragExempt(target: EventTarget | null): boolean {
	return target instanceof Element && !!target.closest('[data-dnd-ignore]')
}

class BoardMouseSensor extends MouseSensor {
	static activators = [
		{
			eventName: 'onMouseDown' as const,
			handler: ({ nativeEvent }: MouseEvent) => !isDragExempt(nativeEvent.target),
		},
	]
}

class BoardTouchSensor extends TouchSensor {
	static activators = [
		{
			eventName: 'onTouchStart' as const,
			handler: ({ nativeEvent }: TouchEvent) => !isDragExempt(nativeEvent.target),
		},
	]
}

/** A drop lands either on a column or on another card sitting in one. */
function resolveDropColumn(overId: string | null, cards: TBoardCard[]): TaskStatus | null {
	if (!overId) {
		return null
	}

	if (TASK_STATUSES.includes(overId as TaskStatus)) {
		return overId as TaskStatus
	}

	return cards.find((card) => card.id === overId)?.task.status ?? null
}

interface ITasksBoardProps {
	tasks: Task[]
	/** Doubles as column visibility: an empty selection shows every column. */
	statusFilter: TaskStatus[]
	isFiltered: boolean
	onClearFilters: () => void
	onNewTask: () => void
	onStatusChange: (task: Task, status: TaskStatus) => void
	onDetails: (task: Task) => void
	onEdit: (task: Task) => void
	onPlan: (task: Task) => void
	onLogWork: (task: Task) => void
	onDelete: (task: Task) => void
}

export function TasksBoard({
	tasks,
	statusFilter,
	isFiltered,
	onClearFilters,
	onNewTask,
	onStatusChange,
	...cardActions
}: ITasksBoardProps) {
	const [showAllDone, setShowAllDone] = useState(false)
	const [drag, setDrag] = useState<IDragState | null>(null)

	// The provider reports the move after we already cleared the drag, so the
	// state above is only for rendering and this is what says a drag is live.
	const dragRef = useRef<IDragState | null>(null)

	const sensors = useSensors(
		// Without a threshold the card would start dragging on mousedown and
		// swallow the click that opens the details sheet.
		useSensor(BoardMouseSensor, { activationConstraint: { distance: 5 } }),
		useSensor(BoardTouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
		useSensor(KeyboardSensor),
	)

	const columns = useMemo(
		() => buildTaskBoard(tasks, { statusFilter, showAllDone }),
		[tasks, statusFilter, showAllDone],
	)

	const cards = useMemo(() => columns.flatMap((column) => column.cards), [columns])

	// The kanban mutates the array it is given, so every render ships fresh
	// objects: the tasks stay the source of truth and the preview lives in state.
	const data = cards.map((card) => ({
		...card,
		column: drag?.id === card.id ? drag.column : card.task.status,
	}))

	const draggedTask = drag ? cards.find((card) => card.id === drag.id)?.task : undefined

	const handleDragStart = (event: DragStartEvent) => {
		const card = cards.find((item) => item.id === event.active.id)

		if (!card) {
			return
		}

		const next = { id: card.id, column: card.task.status }

		dragRef.current = next
		setDrag(next)
	}

	// Refused targets never take the preview, so a card is never seen resting
	// somewhere the rules would not let it stay.
	const handleDataChange = (next: TBoardCard[]) => {
		const pending = dragRef.current

		if (!pending) {
			return
		}

		const moved = next.find((item) => item.id === pending.id)
		const task = cards.find((item) => item.id === pending.id)?.task

		if (!moved || !task || moved.column === pending.column) {
			return
		}

		if (!canTransitionTask(task.status, moved.column)) {
			return
		}

		const accepted = { id: pending.id, column: moved.column }

		dragRef.current = accepted
		setDrag(accepted)
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const pending = dragRef.current

		dragRef.current = null
		setDrag(null)

		const task = pending ? cards.find((item) => item.id === pending.id)?.task : undefined

		if (!pending || !task) {
			return
		}

		const dropped = resolveDropColumn(event.over ? String(event.over.id) : null, cards)

		// The preview stopped at the last legal column, so an illegal drop has to
		// be explained here or it would look like nothing happened.
		if (dropped && !canTransitionTask(task.status, dropped)) {
			toast.error(`“${task.title}” cannot move to ${TASK_STATUS_LABEL[dropped]}`, {
				description: `From ${TASK_STATUS_LABEL[task.status]} it can only move to ${describeTaskTransitions(
					task.status,
					TASK_STATUS_LABEL,
				)}.`,
			})

			return
		}

		if (pending.column !== task.status) {
			onStatusChange(task, pending.column)
		}
	}

	if (columns.every((column) => column.total === 0)) {
		return (
			<div className="flex min-h-0 flex-1 items-center justify-center p-4">
				<TasksEmptyState
					filtered={isFiltered}
					onClearFilters={onClearFilters}
					onNewTask={onNewTask}
				/>
			</div>
		)
	}

	return (
		<div className="min-h-0 flex-1 p-6">
			{/* Columns stay side by side and scroll horizontally on narrow screens:
			    stacking them would turn the flow into three separate lists. */}
			<KanbanProvider<TBoardCard, TaskBoardColumn>
				columns={columns}
				data={data}
				sensors={sensors}
				onDataChange={handleDataChange}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				className="auto-cols-[minmax(16rem,1fr)] gap-3 overflow-x-auto pb-1"
			>
				{(column) => {
					const Icon = TASK_STATUS_ICON[column.id]
					const isEmpty = column.cards.length === 0
					const isRefused = !!draggedTask && !canTransitionTask(draggedTask.status, column.id)
					const hiddenCount = column.total - column.cards.length

					return (
						<KanbanBoard
							id={column.id}
							key={column.id}
							className={cn([
								'rounded-lg bg-muted/40 shadow-none transition-opacity',
								// The cards area is what scrolls, so the header and the
								// footer keep their place while the column grows.
								!isEmpty &&
									'[&>[data-slot=scroll-area]]:min-h-0 [&>[data-slot=scroll-area]]:flex-1',
								isRefused && 'opacity-40',
							])}
						>
							<KanbanHeader className="flex items-center justify-between gap-2 px-3 py-2.5">
								<div className="flex items-center gap-2">
									<Icon className={cn(['size-3.5', TASK_STATUS_ICON_COLOR[column.id]])} />
									<span className="text-sm">{column.name}</span>
								</div>

								<span className="text-muted-foreground text-xs tabular-nums">{column.total}</span>
							</KanbanHeader>

							<KanbanCards id={column.id} className="gap-2 p-2">
								{(card: TBoardCard) => <TaskBoardCard key={card.id} card={card} {...cardActions} />}
							</KanbanCards>

							{isEmpty && (
								<p className="flex flex-1 items-center justify-center p-4 text-center text-muted-foreground text-xs">
									Drop tasks here
								</p>
							)}

							{hiddenCount > 0 && (
								<div className="p-2 pt-0">
									<Button
										variant="ghost"
										size="sm"
										className="w-full text-muted-foreground"
										onClick={() => setShowAllDone(true)}
									>
										Show all ({column.total})
									</Button>
								</div>
							)}
						</KanbanBoard>
					)
				}}
			</KanbanProvider>
		</div>
	)
}

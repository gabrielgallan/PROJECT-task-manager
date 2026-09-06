import { formatDistanceToNowStrict } from 'date-fns'
import {
	animate,
	type HTMLMotionProps,
	motion,
	useMotionValue,
	useReducedMotion,
} from 'motion/react'
import { useRef, useState } from 'react'
import { Pagination } from '@/components/pagination'
import { useTaskPending } from '@/features/tasks/hooks/use-task-pending'
import {
	TASK_PRIORITY_BADGE_COLOR,
	TASK_PRIORITY_LABEL,
} from '@/features/tasks/model/task-priority'
import { type ITaskQueryResult, TASKS_PAGE_SIZE } from '@/features/tasks/model/task-query'
import {
	TASK_STATUS_ICON,
	TASK_STATUS_ICON_COLOR,
	TASK_STATUS_LABEL,
} from '@/features/tasks/model/task-status'
import { type ITaskTransition, TASK_TRANSITIONS } from '@/features/tasks/model/task-transitions'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'
import { TaskMobileActionsSheet } from './task-mobile-actions-sheet'
import { TasksEmptyState } from './tasks-empty-state'

type SwipeDirection = 'left' | 'right'

interface ITasksMobileListProps {
	result: ITaskQueryResult
	filtered: boolean
	onPageChange: (page: number) => void
	onClearFilters: () => void
	onNewTask: () => void
	onStatusChange: (task: Task, status: TaskStatus) => Promise<void>
	onDetails: (task: Task) => void
	onEdit: (task: Task) => void
	onDelete: (task: Task) => void
}

interface ISwipeableTaskItemProps {
	task: Task
	actionsOpen: boolean
	onStatusChange: (task: Task, status: TaskStatus) => Promise<void>
	onOpenActions: (task: Task) => void
}

const SWIPE_THRESHOLD = 52
const SWIPE_LIMIT = 96
const SWIPE_TARGET: Record<TaskStatus, Partial<Record<SwipeDirection, TaskStatus>>> = {
	BACKLOG: { right: 'IN_PROGRESS' },
	IN_PROGRESS: { right: 'DONE', left: 'BACKLOG' },
	DONE: { left: 'IN_PROGRESS' },
}

const SWIPE_ACTION_COLOR: Record<TaskStatus, string> = {
	BACKLOG: 'bg-slate-600 text-white dark:bg-slate-500 dark:text-slate-950',
	IN_PROGRESS: 'bg-amber-400 text-amber-950',
	DONE: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
}

function dueText(task: Task): string {
	if (!task.dueDate) return 'No due date'

	return `Due ${formatDistanceToNowStrict(task.dueDate, { addSuffix: true })}`
}

function getSwipeAction(task: Task, direction: SwipeDirection): ITaskTransition | undefined {
	const target = SWIPE_TARGET[task.status][direction]

	return target
		? TASK_TRANSITIONS[task.status].find((transition) => transition.to === target)
		: undefined
}

function SwipeAction({
	action,
	direction,
}: {
	action: ITaskTransition
	direction: SwipeDirection
}) {
	const ActionIcon = action.icon

	return (
		<div
			aria-hidden="true"
			className={cn(
				'absolute inset-y-0 flex w-24 items-center justify-center rounded-lg',
				direction === 'left' ? 'right-0' : 'left-0',
				SWIPE_ACTION_COLOR[action.to],
			)}
		>
			<ActionIcon className="size-6 shrink-0" />
		</div>
	)
}

function AccessibleSwipeAction({
	action,
	direction,
	task,
	disabled,
	onAction,
}: {
	action: ITaskTransition
	direction: SwipeDirection
	task: Task
	disabled: boolean
	onAction: () => void
}) {
	const ActionIcon = action.icon

	return (
		<button
			type="button"
			disabled={disabled}
			aria-label={`${action.label}: ${task.title}`}
			onClick={onAction}
			className={cn(
				'sr-only rounded-md bg-background px-3 py-2 text-xs font-medium shadow-sm',
				'focus:not-sr-only focus:absolute focus:inset-y-2 focus:z-20 focus:flex',
				'focus:items-center focus:gap-2 focus:outline-none focus-visible:ring-2',
				'focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
				direction === 'left' ? 'focus:right-2' : 'focus:left-2',
			)}
		>
			<ActionIcon className="size-4 shrink-0" />
			{action.label}
		</button>
	)
}

function SwipeableTaskItem({
	task,
	actionsOpen,
	onStatusChange,
	onOpenActions,
}: ISwipeableTaskItemProps) {
	const x = useMotionValue(0)
	const shouldReduceMotion = useReducedMotion()
	const pending = useTaskPending(task.id)
	const [isSettling, setIsSettling] = useState(false)
	const didDrag = useRef(false)
	const leftAction = getSwipeAction(task, 'left')
	const rightAction = getSwipeAction(task, 'right')
	const StatusIcon = TASK_STATUS_ICON[task.status]
	const disabled = pending || isSettling

	const settle = async (action?: ITaskTransition) => {
		if (disabled) return
		setIsSettling(true)

		try {
			await animate(x, 0, {
				duration: shouldReduceMotion ? 0 : 0.18,
				ease: [0.22, 1, 0.36, 1],
			})

			if (action) await onStatusChange(task, action.to)
		} finally {
			setIsSettling(false)
		}
	}

	const handleDragEnd: NonNullable<HTMLMotionProps<'button'>['onDragEnd']> = (_event, info) => {
		const direction: SwipeDirection = info.offset.x < 0 ? 'left' : 'right'
		const action = getSwipeAction(task, direction)
		const shouldCommit = Math.abs(info.offset.x) >= SWIPE_THRESHOLD

		void settle(shouldCommit ? action : undefined)
	}

	const openActions = () => {
		const dragged = didDrag.current
		didDrag.current = false
		if (!dragged) onOpenActions(task)
	}

	return (
		<li className="relative isolate rounded-lg">
			<div className="relative overflow-hidden rounded-lg">
				{leftAction && <SwipeAction action={leftAction} direction="left" />}
				{rightAction && <SwipeAction action={rightAction} direction="right" />}

				<motion.button
					type="button"
					disabled={disabled}
					aria-haspopup="dialog"
					aria-expanded={actionsOpen || undefined}
					drag={disabled ? false : 'x'}
					dragConstraints={{
						left: leftAction ? -SWIPE_LIMIT : 0,
						right: rightAction ? SWIPE_LIMIT : 0,
					}}
					dragElastic={0.1}
					dragMomentum={false}
					onClick={openActions}
					onKeyDown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') didDrag.current = false
					}}
					onPointerDown={() => {
						didDrag.current = false
					}}
					onDragStart={() => {
						didDrag.current = true
					}}
					onDragEnd={handleDragEnd}
					style={{ x, touchAction: 'pan-y' }}
					className="relative z-10 flex w-full cursor-grab items-start bg-secondary p-4 text-left outline-none select-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default dark:bg-card"
				>
					<StatusIcon
						aria-hidden="true"
						className={cn('mt-1 size-4 shrink-0', TASK_STATUS_ICON_COLOR[task.status])}
					/>
					<span className="sr-only">Status: {TASK_STATUS_LABEL[task.status]}</span>

					<div className="ml-4 min-w-0 flex-1">
						<p className="truncate font-medium">{task.title}</p>

						<div className="mt-1 flex items-end justify-between gap-3">
							<span
								className={cn(
									'shrink-0 rounded-md px-2 py-1 text-xs font-medium',
									TASK_PRIORITY_BADGE_COLOR[task.priority],
								)}
							>
								{TASK_PRIORITY_LABEL[task.priority]}
							</span>

							<p className="truncate text-right text-xs text-muted-foreground">{dueText(task)}</p>
						</div>
					</div>
				</motion.button>
			</div>

			{leftAction && (
				<AccessibleSwipeAction
					action={leftAction}
					direction="left"
					task={task}
					disabled={disabled}
					onAction={() => void settle(leftAction)}
				/>
			)}
			{rightAction && (
				<AccessibleSwipeAction
					action={rightAction}
					direction="right"
					task={task}
					disabled={disabled}
					onAction={() => void settle(rightAction)}
				/>
			)}
		</li>
	)
}

export function TasksMobileList({
	result,
	filtered,
	onPageChange,
	onClearFilters,
	onNewTask,
	onStatusChange,
	onDetails,
	onEdit,
	onDelete,
}: ITasksMobileListProps) {
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)
	const [actionsOpen, setActionsOpen] = useState(false)

	const openActions = (task: Task) => {
		setSelectedTask(task)
		setActionsOpen(true)
	}

	return (
		<>
			<div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
				{result.tasks.length === 0 ? (
					<TasksEmptyState
						filtered={filtered}
						onClearFilters={onClearFilters}
						onNewTask={onNewTask}
					/>
				) : (
					<>
						<ul className="flex flex-col gap-1 rounded-lg">
							{result.tasks.map((task) => (
								<SwipeableTaskItem
									key={task.id}
									task={task}
									actionsOpen={actionsOpen && selectedTask?.id === task.id}
									onStatusChange={onStatusChange}
									onOpenActions={openActions}
								/>
							))}
						</ul>

						<Pagination
							limit={TASKS_PAGE_SIZE}
							page={result.page}
							total={result.total}
							onPageChange={onPageChange}
						/>
					</>
				)}
			</div>

			<TaskMobileActionsSheet
				task={selectedTask}
				open={actionsOpen}
				onOpenChange={setActionsOpen}
				onDetails={onDetails}
				onEdit={onEdit}
				onDelete={onDelete}
			/>
		</>
	)
}

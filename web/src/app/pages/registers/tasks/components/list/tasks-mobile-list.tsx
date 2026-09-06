import { formatDistanceToNowStrict } from 'date-fns'
import {
	animate,
	type HTMLMotionProps,
	motion,
	useMotionValue,
	useReducedMotion,
} from 'motion/react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Pagination } from '@/components/pagination'
import type { TaskDto } from '@/features/tasks/model/task-api-types'
import { toTask } from '@/features/tasks/model/task-mappers'
import {
	TASK_PRIORITY_BADGE_COLOR,
	TASK_PRIORITY_LABEL,
} from '@/features/tasks/model/task-priority'
import {
	TASK_STATUS_ICON,
	TASK_STATUS_ICON_COLOR,
	TASK_STATUS_LABEL,
} from '@/features/tasks/model/task-status'
import { type ITaskTransition, TASK_TRANSITIONS } from '@/features/tasks/model/task-transitions'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'
import { TaskMobileActionsSheet } from './task-mobile-actions-sheet'

type SwipeDirection = 'left' | 'right'

interface ISwipeableTaskItemProps {
	task: Task
	actionsOpen: boolean
	onStatusChange: (task: Task, status: TaskStatus) => void
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
	BACKLOG: 'bg-slate-400 text-background',
	IN_PROGRESS: 'bg-orange-300 text-background',
	DONE: 'bg-emerald-400 text-background',
}

const MOBILE_TASKS_MOCK: TaskDto[] = [
	{
		id: 'mobile-task-1',
		title: 'Normalize IP addresses before persistence',
		description: 'Normalize IPv4 and IPv6 values before saving device events.',
		status: 'BACKLOG',
		priority: 'LOW',
		startDate: null,
		dueDate: '2026-09-07T00:00:00.000Z',
		createdAt: '2026-08-28T14:20:00.000Z',
		updatedAt: '2026-09-01T16:45:00.000Z',
	},
	{
		id: 'mobile-task-2',
		title: 'Correct timezone conversion in work logs',
		description: null,
		status: 'IN_PROGRESS',
		priority: 'HIGH',
		startDate: '2026-09-01T00:00:00.000Z',
		dueDate: '2026-09-04T00:00:00.000Z',
		createdAt: '2026-08-25T11:10:00.000Z',
		updatedAt: '2026-09-05T12:30:00.000Z',
	},
	{
		id: 'mobile-task-3',
		title: 'Review the mobile navigation structure',
		description: 'Validate labels and navigation order on small screens.',
		status: 'DONE',
		priority: 'MEDIUM',
		startDate: '2026-08-30T00:00:00.000Z',
		dueDate: '2026-09-02T00:00:00.000Z',
		createdAt: '2026-08-29T09:00:00.000Z',
		updatedAt: '2026-09-02T18:15:00.000Z',
	},
	{
		id: 'mobile-task-4',
		title: 'Investigate intermittent camera reconnection failures in production',
		description: 'Compare SDK callbacks with the reconnect event history.',
		status: 'IN_PROGRESS',
		priority: 'CRITICAL',
		startDate: '2026-09-03T00:00:00.000Z',
		dueDate: '2026-09-20T00:00:00.000Z',
		createdAt: '2026-09-03T13:40:00.000Z',
		updatedAt: null,
	},
	{
		id: 'mobile-task-5',
		title: 'Document the task query parameters',
		description: null,
		status: 'BACKLOG',
		priority: 'MEDIUM',
		startDate: null,
		dueDate: null,
		createdAt: '2026-09-05T10:00:00.000Z',
		updatedAt: null,
	},
]

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
	const [isSettling, setIsSettling] = useState(false)
	const didDrag = useRef(false)
	const leftAction = getSwipeAction(task, 'left')
	const rightAction = getSwipeAction(task, 'right')
	const StatusIcon = TASK_STATUS_ICON[task.status]

	const settle = async (action?: ITaskTransition) => {
		setIsSettling(true)

		try {
			await animate(x, 0, {
				duration: shouldReduceMotion ? 0 : 0.18,
				ease: [0.22, 1, 0.36, 1],
			})

			if (action) onStatusChange(task, action.to)
		} finally {
			setIsSettling(false)
		}
	}

	const handleDragEnd: NonNullable<HTMLMotionProps<'button'>['onDragEnd']> = (_event, info) => {
		const direction: SwipeDirection = info.offset.x < 0 ? 'left' : 'right'
		const action = getSwipeAction(task, direction)
		const shouldCommit = Math.abs(info.offset.x) >= SWIPE_THRESHOLD

		void settle(shouldCommit ? action : undefined)
		window.setTimeout(() => {
			didDrag.current = false
		}, 0)
	}

	const openActions = () => {
		if (!didDrag.current) onOpenActions(task)
	}

	return (
		<li className="relative isolate overflow-hidden rounded-lg">
			{leftAction && <SwipeAction action={leftAction} direction="left" />}
			{rightAction && <SwipeAction action={rightAction} direction="right" />}

			{leftAction && (
				<AccessibleSwipeAction
					action={leftAction}
					direction="left"
					task={task}
					disabled={isSettling}
					onAction={() => onStatusChange(task, leftAction.to)}
				/>
			)}
			{rightAction && (
				<AccessibleSwipeAction
					action={rightAction}
					direction="right"
					task={task}
					disabled={isSettling}
					onAction={() => onStatusChange(task, rightAction.to)}
				/>
			)}

			<motion.button
				type="button"
				disabled={isSettling}
				aria-haspopup="dialog"
				aria-expanded={actionsOpen}
				drag={isSettling ? false : 'x'}
				dragConstraints={{
					left: leftAction ? -SWIPE_LIMIT : 0,
					right: rightAction ? SWIPE_LIMIT : 0,
				}}
				dragElastic={0.1}
				dragMomentum={false}
				onClick={openActions}
				onDragStart={() => {
					didDrag.current = true
				}}
				onDragEnd={handleDragEnd}
				style={{ x, touchAction: 'pan-y' }}
				className="relative z-10 flex w-full cursor-grab items-start bg-secondary p-4 text-left outline-none select-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default dark:bg-card"
			>
				<StatusIcon
					aria-hidden="true"
					className={cn('size-4 mt-1 shrink-0', TASK_STATUS_ICON_COLOR[task.status])}
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
		</li>
	)
}

export function TasksMobileList() {
	const [tasks, setTasks] = useState<Task[]>(() => MOBILE_TASKS_MOCK.map(toTask))
	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
	const [actionsOpen, setActionsOpen] = useState(false)
	const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

	const changeStatus = (task: Task, status: TaskStatus) => {
		setTasks((current) =>
			current.map((currentTask) =>
				currentTask.id === task.id ? { ...currentTask, status } : currentTask,
			),
		)
		toast.success(`“${task.title}” moved to ${TASK_STATUS_LABEL[status]}`)
	}

	const openActions = (task: Task) => {
		setSelectedTaskId(task.id)
		setActionsOpen(true)
	}

	return (
		<>
			<div className="p-4 flex flex-col gap-4">
				<ul className="flex flex-col gap-1 overflow-hidden rounded-lg">
					{tasks.map((task) => (
						<SwipeableTaskItem
							key={task.id}
							task={task}
							actionsOpen={actionsOpen && selectedTaskId === task.id}
							onStatusChange={changeStatus}
							onOpenActions={openActions}
						/>
					))}
				</ul>

				<Pagination limit={10} onPageChange={() => {}} page={1} total={110} />
			</div>

			<TaskMobileActionsSheet
				task={selectedTask}
				open={actionsOpen}
				onOpenChange={setActionsOpen}
			/>
		</>
	)
}

import { CircleCheck, CircleDashed, type LucideIcon, SquircleDashed } from 'lucide-react'
import type { TaskStatus } from '@/features/tasks/model/task-types'

/** Lifecycle order. Sorting relies on it, so it is not a free list. */
export const TASK_STATUSES: TaskStatus[] = ['BACKLOG', 'IN_PROGRESS', 'DONE']

/**
 * Status is not alphabetical data, so ordering by it has to follow the lifecycle.
 * Whenever the API takes over sorting it has to reproduce exactly this order.
 */
export const TASK_STATUS_RANK: Record<TaskStatus, number> = {
	BACKLOG: 0,
	IN_PROGRESS: 1,
	DONE: 2,
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
	BACKLOG: 'Backlog',
	IN_PROGRESS: 'In progress',
	DONE: 'Done',
}

export const TASK_STATUS_ICON: Record<TaskStatus, LucideIcon> = {
	BACKLOG: SquircleDashed,
	IN_PROGRESS: CircleDashed,
	DONE: CircleCheck,
}

export const TASK_STATUS_ICON_COLOR: Record<TaskStatus, string> = {
	BACKLOG: 'text-slate-500',
	IN_PROGRESS: 'text-amber-500',
	DONE: 'fill-emerald-500 stroke-emerald-500 [&>path]:stroke-background',
}

/**
 * Same slate / amber / emerald of the badges above, as raw values for charts.
 * Reading both from here is what keeps a chart from drifting from the table.
 */
export const TASK_STATUS_CHART_COLOR: Record<TaskStatus, string> = {
	BACKLOG: 'oklch(0.554 0.046 257.417)',
	IN_PROGRESS: 'oklch(0.769 0.188 70.08)',
	DONE: 'oklch(0.723 0.219 149.579)',
}

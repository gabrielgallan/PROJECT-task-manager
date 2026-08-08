import { CircleCheck, CircleDashed, type LucideIcon, SquircleDashed } from 'lucide-react'
import type { TaskStatus } from '@/features/tasks/model/task-types'

/** Lifecycle order. Sorting relies on it, so it is not a free list. */
export const TASK_STATUSES: TaskStatus[] = ['backlog', 'in_progress', 'done']

/**
 * Status is not alphabetical data, so ordering by it has to follow the lifecycle.
 * Whenever the API takes over sorting it has to reproduce exactly this order.
 */
export const TASK_STATUS_RANK: Record<TaskStatus, number> = {
	backlog: 0,
	in_progress: 1,
	done: 2,
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
	backlog: 'Backlog',
	in_progress: 'In progress',
	done: 'Done',
}

export const TASK_STATUS_ICON: Record<TaskStatus, LucideIcon> = {
	backlog: SquircleDashed,
	in_progress: CircleDashed,
	done: CircleCheck,
}

export const TASK_STATUS_ICON_COLOR: Record<TaskStatus, string> = {
	backlog: 'text-slate-500',
	in_progress: 'text-amber-500',
	done: 'fill-emerald-500 stroke-emerald-500 [&>path]:stroke-background',
}

/**
 * Same slate / amber / emerald of the badges above, as raw values for charts.
 * Reading both from here is what keeps a chart from drifting from the table.
 */
export const TASK_STATUS_CHART_COLOR: Record<TaskStatus, string> = {
	backlog: 'oklch(0.554 0.046 257.417)',
	in_progress: 'oklch(0.769 0.188 70.08)',
	done: 'oklch(0.723 0.219 149.579)',
}

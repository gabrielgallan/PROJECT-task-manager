import type { TaskPriority } from '@/features/tasks/model/task-types'

/** Ascending urgency. Sorting relies on it, so it is not a free list. */
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

/**
 * Priority is not alphabetical data either, so ordering by it follows urgency.
 * Whenever the API takes over sorting it has to reproduce exactly this order.
 */
export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
	LOW: 0,
	MEDIUM: 1,
	HIGH: 2,
	CRITICAL: 3,
}

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
	LOW: 'Low',
	MEDIUM: 'Medium',
	HIGH: 'High',
	CRITICAL: 'Critical',
}

export const TASK_PRIORITY_COLOR: Record<TaskPriority, string> = {
	LOW: 'bg-slate-500',
	MEDIUM: 'bg-amber-500',
	HIGH: 'bg-rose-500',
	CRITICAL: 'bg-violet-400',
}

export const TASK_PRIORITY_BADGE_COLOR: Record<TaskPriority, string> = {
	LOW: 'bg-slate-500/20 text-slate-600 dark:text-slate-400',
	MEDIUM: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
	HIGH: 'bg-rose-500/20 text-rose-700 dark:text-rose-400',
	CRITICAL: 'bg-violet-500/20 text-violet-700 dark:text-violet-400',
}

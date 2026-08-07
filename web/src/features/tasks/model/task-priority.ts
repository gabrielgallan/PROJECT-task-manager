import type { TaskPriority } from '@/features/tasks/model/task-types'

/** Ascending urgency. Sorting relies on it, so it is not a free list. */
export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical']

/**
 * Priority is not alphabetical data either, so ordering by it follows urgency.
 * Whenever the API takes over sorting it has to reproduce exactly this order.
 */
export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
	low: 0,
	medium: 1,
	high: 2,
	critical: 3,
}

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
	low: 'Low',
	medium: 'Medium',
	high: 'High',
	critical: 'Critical',
}

export const TASK_PRIORITY_COLOR: Record<TaskPriority, string> = {
	low: 'bg-slate-500',
	medium: 'bg-amber-500',
	high: 'bg-rose-500',
	critical: 'bg-violet-400',
}

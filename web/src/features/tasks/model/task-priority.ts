import type { TaskPriority } from '@/features/tasks/model/task-types'

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical']

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

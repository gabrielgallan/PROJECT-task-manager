import { CircleCheck, CirclePlay, RotateCcw, Undo2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TaskStatus } from '@/features/tasks/model/task-types'

export interface ITaskTransition {
	to: TaskStatus
	label: string
	icon: LucideIcon
}

/**
 * Status changes offered straight from the row menu, most likely one first.
 * They are capped at two per status so the menu keeps a predictable height and
 * the stable actions below it never move far.
 */
export const TASK_TRANSITIONS: Record<TaskStatus, ITaskTransition[]> = {
	backlog: [
		{ to: 'in_progress', label: 'Start', icon: CirclePlay },
		{ to: 'done', label: 'Mark as done', icon: CircleCheck },
	],
	in_progress: [
		{ to: 'done', label: 'Mark as done', icon: CircleCheck },
		{ to: 'backlog', label: 'Move to backlog', icon: Undo2 },
	],
	done: [{ to: 'in_progress', label: 'Reopen', icon: RotateCcw }],
}

/** Planning is about work still ahead, so it stops making sense once done. */
export function canPlanTask(status: TaskStatus): boolean {
	return status !== 'done'
}

/** A work log records what was actually done, including on finished work. */
export function canLogWorkForTask(status: TaskStatus): boolean {
	return status !== 'backlog'
}

import type { LucideIcon } from 'lucide-react'
import { CircleCheck, CirclePlay, RotateCcw, Undo2 } from 'lucide-react'
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
	BACKLOG: [
		{ to: 'IN_PROGRESS', label: 'Start', icon: CirclePlay },
		{ to: 'DONE', label: 'Mark as done', icon: CircleCheck },
	],
	IN_PROGRESS: [
		{ to: 'DONE', label: 'Mark as done', icon: CircleCheck },
		{ to: 'BACKLOG', label: 'Move to backlog', icon: Undo2 },
	],
	DONE: [
		{ to: 'IN_PROGRESS', label: 'Reopen', icon: RotateCcw },
		{ to: 'BACKLOG', label: 'Move to backlog', icon: Undo2 },
	],
}

/**
 * The list above doubles as the movement rule: a status change that is not
 * offered there is not legal anywhere, including a drag on the board. Landing a
 * card back on its own column is a no-op, so it always passes.
 */
export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
	return from === to || TASK_TRANSITIONS[from].some((transition) => transition.to === to)
}

/** Reads as "Done or In progress", for messages explaining a refused move. */
export function describeTaskTransitions(
	from: TaskStatus,
	labels: Record<TaskStatus, string>,
): string {
	return TASK_TRANSITIONS[from].map((transition) => labels[transition.to]).join(' or ')
}

/** Planning is about work still ahead, so it stops making sense once done. */
export function canPlanTask(status: TaskStatus): boolean {
	return status !== 'DONE'
}

/** A work log records what was actually done, including on finished work. */
export function canLogWorkForTask(status: TaskStatus): boolean {
	return status !== 'BACKLOG'
}

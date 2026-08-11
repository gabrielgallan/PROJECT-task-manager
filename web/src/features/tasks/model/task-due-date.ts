import { differenceInCalendarDays } from 'date-fns'
import type { Task } from '@/features/tasks/model/task-types'

/** How far ahead a deadline still counts as "coming up" rather than just future. */
const DUE_SOON_DAYS = 7

/**
 * The table and the board have to read a deadline the same way, otherwise the
 * same date would look urgent in one view and ordinary in the other. Finished
 * work never counts as late: the date stopped being a commitment.
 */
export function isTaskLate(task: Task): boolean {
	return task.status !== 'done' && !!task.dueDate && task.dueDate < new Date()
}

export function isTaskDueSoon(task: Task): boolean {
	if (task.status === 'done' || !task.dueDate) {
		return false
	}

	const daysUntilDue = differenceInCalendarDays(task.dueDate, new Date())

	return daysUntilDue >= 0 && daysUntilDue <= DUE_SOON_DAYS
}

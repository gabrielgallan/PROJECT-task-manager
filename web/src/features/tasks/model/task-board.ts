import { TASK_STATUS_LABEL, TASK_STATUSES } from '@/features/tasks/model/task-status'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'

/**
 * The board mirrors the gantt model: it turns tasks into whatever the kibo
 * component expects, and keeps the original task attached so the cards can be
 * rendered with the same rules as the table.
 *
 * `id`, `name` and `column` are the contract read by the kanban; everything
 * else travels along untouched. The column id is the status itself, so a drop
 * target is already the status the card would move to.
 */
export type TaskBoardCard = {
	id: string
	name: string
	column: TaskStatus
	task: Task
}

export type TaskBoardColumn = {
	id: TaskStatus
	name: string
	cards: TaskBoardCard[]
	/** Every match in the column, which the Done cut below must not hide. */
	total: number
}

/** Done keeps growing while the other columns drain, so it opens as a slice. */
export const DONE_PREVIEW_LIMIT = 8

function toCard(task: Task): TaskBoardCard {
	return { id: task.id, name: task.title, column: task.status, task }
}

/**
 * The board has no sort control of its own, so ordering is fixed instead of
 * inheriting whatever the table was last sorted by — which would look arbitrary
 * when arriving from another view. Work ahead is read by urgency; a missing due
 * date carries no urgency, so it sinks instead of leading.
 */
function byDueDate(a: Task, b: Task): number {
	if (!a.dueDate || !b.dueDate) {
		if (a.dueDate) {
			return -1
		}

		if (b.dueDate) {
			return 1
		}

		return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
	}

	return a.dueDate.getTime() - b.dueDate.getTime()
}

/** Finished work is read as history, so the latest is what matters. */
function byRecentUpdate(a: Task, b: Task): number {
	return b.updatedAt.getTime() - a.updatedAt.getTime()
}

export interface IBuildTaskBoardOptions {
	/**
	 * The status filter doubles as column visibility here. An empty selection
	 * means "every column", the same way it means "every value" when filtering.
	 */
	statusFilter: TaskStatus[]
	showAllDone: boolean
}

export function buildTaskBoard(
	tasks: Task[],
	{ statusFilter, showAllDone }: IBuildTaskBoardOptions,
): TaskBoardColumn[] {
	// Filtering the canonical list instead of mapping the selection keeps the
	// columns in lifecycle order however the filter was clicked.
	const statuses =
		statusFilter.length > 0
			? TASK_STATUSES.filter((status) => statusFilter.includes(status))
			: TASK_STATUSES

	return statuses.map((status) => {
		const matched = tasks
			.filter((task) => task.status === status)
			.sort(status === 'DONE' ? byRecentUpdate : byDueDate)

		const visible =
			status === 'DONE' && !showAllDone ? matched.slice(0, DONE_PREVIEW_LIMIT) : matched

		return {
			id: status,
			name: TASK_STATUS_LABEL[status],
			cards: visible.map(toCard),
			total: matched.length,
		}
	})
}

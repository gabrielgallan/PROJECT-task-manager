import type { GanttFeature, GanttStatus } from '@/components/kibo-ui/gantt'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'

/**
 * The gantt renders status as a raw color, so the palette is mirrored from the
 * badges used in the tasks table (slate-500 / amber-500 / emerald-500) to keep
 * both views readable in the same way.
 */
export const TASK_STATUS_META: Record<TaskStatus, GanttStatus> = {
	backlog: { id: 'backlog', name: 'Backlog', color: '#62748e' },
	in_progress: { id: 'in_progress', name: 'In progress', color: '#f59e0b' },
	done: { id: 'done', name: 'Done', color: '#10b981' },
}

/** Work in flight first, finished work last. */
const TASK_STATUS_ORDER: TaskStatus[] = ['in_progress', 'backlog', 'done']

export type TaskGanttFeature = GanttFeature & {
	task: Task
}

export interface TaskGanttGroup {
	status: TaskStatus
	name: string
	features: TaskGanttFeature[]
}

export interface TaskGanttData {
	groups: TaskGanttGroup[]
	/** Tasks that cannot be placed on the timeline because they have no due date. */
	undatedTasks: Task[]
}

/**
 * A task only owns a due date, so the bar spans from its planned start (or its
 * creation, as a fallback) until the delivery date.
 */
export function toGanttFeature(task: Task): TaskGanttFeature | null {
	if (!task.dueDate) {
		return null
	}

	const endAt = task.dueDate
	const start = task.startDate ?? task.createdAt

	return {
		id: task.id,
		name: task.title,
		// A task created after its own due date would otherwise render backwards.
		startAt: start > endAt ? endAt : start,
		endAt,
		status: TASK_STATUS_META[task.status],
		task,
	}
}

/**
 * Empty groups are dropped so the sidebar and the timeline keep iterating over
 * the same list — that is what keeps their rows aligned.
 */
export function buildTaskGanttData(tasks: Task[]): TaskGanttData {
	const undatedTasks = tasks.filter((task) => !task.dueDate)

	const groups = TASK_STATUS_ORDER.map((status) => ({
		status,
		name: TASK_STATUS_META[status].name,
		features: tasks
			.filter((task) => task.status === status)
			.map(toGanttFeature)
			.filter((feature): feature is TaskGanttFeature => feature !== null)
			.sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
	})).filter((group) => group.features.length > 0)

	return { groups, undatedTasks }
}

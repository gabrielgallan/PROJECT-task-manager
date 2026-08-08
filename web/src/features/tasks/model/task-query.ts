import { TASK_PRIORITY_RANK } from '@/features/tasks/model/task-priority'
import { TASK_STATUS_RANK } from '@/features/tasks/model/task-status'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'

/**
 * The narrowing part of a listing request. It is split from the rest because the
 * toolbar edits it as a draft and only commits it on demand, while sorting and
 * paging keep taking effect immediately.
 */
export interface ITaskFilters {
	search: string
	status: TaskStatus[]
	priority: TaskPriority[]
}

/**
 * The shape of a task listing request. It is deliberately modelled as if it were
 * already a server call: filtering, sorting and pagination travel together,
 * because sorting only a page of results would order the wrong set. Today the
 * functions below resolve it in memory; later they become a query string.
 */
export interface ITaskQuery extends ITaskFilters {
	sortBy: TTaskSortField
	sortDir: TSortDirection
	page: number
}

export const TASK_SORT_FIELDS = ['title', 'status', 'priority', 'updatedAt', 'dueDate'] as const

export type TTaskSortField = (typeof TASK_SORT_FIELDS)[number]

export type TSortDirection = 'asc' | 'desc'

export const TASKS_PAGE_SIZE = 10

/** Closest deadline first: the list opens on what is most urgent. */
export const DEFAULT_TASK_QUERY: ITaskQuery = {
	search: '',
	status: [],
	priority: [],
	sortBy: 'dueDate',
	sortDir: 'asc',
	page: 1,
}

export const EMPTY_TASK_FILTERS: ITaskFilters = { search: '', status: [], priority: [] }

export function hasActiveTaskFilters(filters: ITaskFilters): boolean {
	return filters.search.trim() !== '' || filters.status.length > 0 || filters.priority.length > 0
}

export function extractTaskFilters(query: ITaskQuery): ITaskFilters {
	return { search: query.search, status: query.status, priority: query.priority }
}

/** Selection order is an artefact of clicking, so it must not count as a change. */
function sameValues<TValue extends string>(a: TValue[], b: TValue[]): boolean {
	return a.length === b.length && a.every((value) => b.includes(value))
}

export function isSameTaskFilters(a: ITaskFilters, b: ITaskFilters): boolean {
	return (
		a.search.trim() === b.search.trim() &&
		sameValues(a.status, b.status) &&
		sameValues(a.priority, b.priority)
	)
}

export function filterTasks(tasks: Task[], query: ITaskQuery): Task[] {
	const term = query.search.trim().toLowerCase()

	return tasks.filter((task) => {
		// An empty selection means "every value", not "no value".
		if (query.status.length > 0 && !query.status.includes(task.status)) {
			return false
		}

		if (query.priority.length > 0 && !query.priority.includes(task.priority)) {
			return false
		}

		if (!term) {
			return true
		}

		return (
			task.title.toLowerCase().includes(term) ||
			(task.description?.toLowerCase().includes(term) ?? false)
		)
	})
}

function compareByField(a: Task, b: Task, field: TTaskSortField): number {
	switch (field) {
		case 'title':
			// Titles are written in pt-BR, so accents must not push words to the end.
			return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
		case 'status':
			return TASK_STATUS_RANK[a.status] - TASK_STATUS_RANK[b.status]
		case 'priority':
			return TASK_PRIORITY_RANK[a.priority] - TASK_PRIORITY_RANK[b.priority]
		case 'updatedAt':
			return a.updatedAt.getTime() - b.updatedAt.getTime()
		case 'dueDate':
			return (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0)
	}
}

export function sortTasks(tasks: Task[], query: ITaskQuery): Task[] {
	const direction = query.sortDir === 'asc' ? 1 : -1

	return [...tasks].sort((a, b) => {
		// A missing due date carries no order, so it sinks to the bottom in both
		// directions instead of flipping to the top when the arrow is reversed.
		if (query.sortBy === 'dueDate' && (!a.dueDate || !b.dueDate)) {
			if (a.dueDate) {
				return -1
			}

			if (b.dueDate) {
				return 1
			}

			return compareByField(a, b, 'title')
		}

		const result = compareByField(a, b, query.sortBy)

		// Ties keep a stable, predictable order instead of following input order.
		return result === 0 ? compareByField(a, b, 'title') : result * direction
	})
}

export interface ITaskQueryResult {
	tasks: Task[]
	total: number
	page: number
	pageCount: number
}

export function applyTaskQuery(tasks: Task[], query: ITaskQuery): ITaskQueryResult {
	const matched = sortTasks(filterTasks(tasks, query), query)
	const pageCount = Math.max(1, Math.ceil(matched.length / TASKS_PAGE_SIZE))

	// Narrowing the filters can leave the URL pointing past the last page.
	const page = Math.min(Math.max(1, query.page), pageCount)
	const start = (page - 1) * TASKS_PAGE_SIZE

	return {
		tasks: matched.slice(start, start + TASKS_PAGE_SIZE),
		total: matched.length,
		page,
		pageCount,
	}
}

import { TASK_PRIORITIES } from '@/features/tasks/model/task-priority'
import {
	DEFAULT_TASK_QUERY,
	type ITaskQuery,
	TASK_SORT_FIELDS,
} from '@/features/tasks/model/task-query'
import { TASK_STATUSES } from '@/features/tasks/model/task-status'

const TASK_QUERY_PARAMS = ['q', 'status', 'priority', 'sortBy', 'sortDir', 'page', 'sort'] as const

/** Domain order also removes duplicates and rejects unknown or legacy values. */
function normalizeValues<TValue extends string>(
	values: readonly string[],
	allowed: readonly TValue[],
): TValue[] {
	return allowed.filter((value) => values.includes(value))
}

function normalizeSort(
	field: string | null,
	direction: string | null,
): Pick<ITaskQuery, 'sortBy' | 'sortDir'> {
	const sortBy = TASK_SORT_FIELDS.find((value) => value === field)

	if (sortBy && (direction === 'asc' || direction === 'desc')) {
		return { sortBy, sortDir: direction }
	}

	return { sortBy: DEFAULT_TASK_QUERY.sortBy, sortDir: DEFAULT_TASK_QUERY.sortDir }
}

function normalizePage(page: number): number {
	return Number.isInteger(page) && page > 0 ? page : DEFAULT_TASK_QUERY.page
}

/** Reading never changes the address bar, including when it contains invalid values. */
export function readTaskQuery(params: URLSearchParams): ITaskQuery {
	return {
		search: params.get('q') ?? '',
		status: normalizeValues(params.getAll('status'), TASK_STATUSES),
		priority: normalizeValues(params.getAll('priority'), TASK_PRIORITIES),
		...normalizeSort(params.get('sortBy'), params.get('sortDir')),
		page: normalizePage(Number(params.get('page'))),
	}
}

/** Each write canonicalizes Tasks parameters while preserving other URL state. */
export function writeTaskQuery(previous: URLSearchParams, query: ITaskQuery): URLSearchParams {
	const params = new URLSearchParams(previous)

	for (const key of TASK_QUERY_PARAMS) {
		params.delete(key)
	}

	const search = query.search.trim()
	if (search) {
		params.set('q', search)
	}

	for (const status of normalizeValues(query.status, TASK_STATUSES)) {
		params.append('status', status)
	}

	for (const priority of normalizeValues(query.priority, TASK_PRIORITIES)) {
		params.append('priority', priority)
	}

	const { sortBy, sortDir } = normalizeSort(query.sortBy, query.sortDir)
	if (sortBy !== DEFAULT_TASK_QUERY.sortBy || sortDir !== DEFAULT_TASK_QUERY.sortDir) {
		params.set('sortBy', sortBy)
		params.set('sortDir', sortDir)
	}

	const page = normalizePage(query.page)
	if (page > DEFAULT_TASK_QUERY.page) {
		params.set('page', String(page))
	}

	return params
}

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TASK_PRIORITIES } from '@/features/tasks/model/task-priority'
import {
	DEFAULT_TASK_QUERY,
	type ITaskFilters,
	type ITaskQuery,
	TASK_SORT_FIELDS,
	type TSortDirection,
	type TTaskSortField,
} from '@/features/tasks/model/task-query'
import { TASK_STATUSES } from '@/features/tasks/model/task-status'
import type { TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'

const SEARCH_PARAM = 'q'
const STATUS_PARAM = 'status'
const PRIORITY_PARAM = 'priority'
const SORT_PARAM = 'sort'
const PAGE_PARAM = 'page'

/** Only values the model knows about survive a hand-edited URL. */
function readList<TValue extends string>(
	params: URLSearchParams,
	key: string,
	allowed: TValue[],
): TValue[] {
	const raw = params.get(key)

	if (!raw) {
		return []
	}

	return raw.split(',').filter((value): value is TValue => allowed.includes(value as TValue))
}

function readSort(params: URLSearchParams): Pick<ITaskQuery, 'sortBy' | 'sortDir'> {
	const [field, direction] = (params.get(SORT_PARAM) ?? '').split(':')

	if (!TASK_SORT_FIELDS.includes(field as TTaskSortField)) {
		return { sortBy: DEFAULT_TASK_QUERY.sortBy, sortDir: DEFAULT_TASK_QUERY.sortDir }
	}

	return {
		sortBy: field as TTaskSortField,
		sortDir: direction === 'desc' ? 'desc' : 'asc',
	}
}

/** An absent parameter is how "no filter" is spelled, so blanks are dropped. */
function writeParam(params: URLSearchParams, key: string, value: string) {
	if (value) {
		params.set(key, value)
	} else {
		params.delete(key)
	}
}

export interface IUseTaskQuery {
	query: ITaskQuery
	applyFilters: (filters: ITaskFilters) => void
	toggleSort: (field: TTaskSortField) => void
	setPage: (page: number) => void
	clearFilters: () => void
}

/**
 * Keeps search, filters, sorting and page in the URL, following the same idea as
 * `useViewParam`: the list and the timeline read one source instead of holding
 * separate state, and the whole listing stays shareable and reload-proof.
 *
 * Filters only reach the URL through `applyFilters`, so what is in the address
 * bar is always what is on screen — never a half-typed intermediate state.
 */
export function useTaskQuery(): IUseTaskQuery {
	const [searchParams, setSearchParams] = useSearchParams()

	const query = useMemo<ITaskQuery>(() => {
		const page = Number(searchParams.get(PAGE_PARAM))

		return {
			search: searchParams.get(SEARCH_PARAM) ?? '',
			status: readList<TaskStatus>(searchParams, STATUS_PARAM, TASK_STATUSES),
			priority: readList<TaskPriority>(searchParams, PRIORITY_PARAM, TASK_PRIORITIES),
			...readSort(searchParams),
			page: Number.isInteger(page) && page > 0 ? page : DEFAULT_TASK_QUERY.page,
		}
	}, [searchParams])

	const write = useCallback(
		(mutate: (params: URLSearchParams) => void) => {
			setSearchParams(
				(previous) => {
					mutate(previous)

					return previous
				},
				// Typing in the search box must not fill the history stack.
				{ replace: true },
			)
		},
		[setSearchParams],
	)

	/** Any change to the result set invalidates the current page number. */
	const writeAndResetPage = useCallback(
		(mutate: (params: URLSearchParams) => void) => {
			write((params) => {
				mutate(params)
				params.delete(PAGE_PARAM)
			})
		},
		[write],
	)

	const applyFilters = useCallback(
		(filters: ITaskFilters) =>
			writeAndResetPage((params) => {
				writeParam(params, SEARCH_PARAM, filters.search.trim())
				writeParam(params, STATUS_PARAM, filters.status.join(','))
				writeParam(params, PRIORITY_PARAM, filters.priority.join(','))
			}),
		[writeAndResetPage],
	)

	const toggleSort = useCallback(
		(field: TTaskSortField) =>
			writeAndResetPage((params) => {
				const { sortBy, sortDir } = readSort(params)
				// Clicking the active column flips it; a new column starts ascending.
				const direction: TSortDirection = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc'

				if (field === DEFAULT_TASK_QUERY.sortBy && direction === DEFAULT_TASK_QUERY.sortDir) {
					params.delete(SORT_PARAM)
				} else {
					params.set(SORT_PARAM, `${field}:${direction}`)
				}
			}),
		[writeAndResetPage],
	)

	const setPage = useCallback(
		(page: number) =>
			write((params) => {
				if (page > 1) {
					params.set(PAGE_PARAM, String(page))
				} else {
					params.delete(PAGE_PARAM)
				}
			}),
		[write],
	)

	const clearFilters = useCallback(
		() =>
			writeAndResetPage((params) => {
				params.delete(SEARCH_PARAM)
				params.delete(STATUS_PARAM)
				params.delete(PRIORITY_PARAM)
			}),
		[writeAndResetPage],
	)

	return { query, applyFilters, toggleSort, setPage, clearFilters }
}

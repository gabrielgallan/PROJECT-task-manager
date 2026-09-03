import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
	DEFAULT_TASK_QUERY,
	EMPTY_TASK_FILTERS,
	type ITaskFilters,
	type ITaskQuery,
	type TTaskSortField,
} from '@/features/tasks/model/task-query'
import { readTaskQuery, writeTaskQuery } from '@/features/tasks/model/task-query-params'

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
	const query = useMemo(() => readTaskQuery(searchParams), [searchParams])

	const write = useCallback(
		(update: (previous: ITaskQuery) => ITaskQuery) => {
			setSearchParams((previous) => writeTaskQuery(previous, update(readTaskQuery(previous))), {
				replace: true,
			})
		},
		[setSearchParams],
	)

	const applyFilters = useCallback(
		(filters: ITaskFilters) =>
			write((previous) => ({ ...previous, ...filters, page: DEFAULT_TASK_QUERY.page })),
		[write],
	)

	const toggleSort = useCallback(
		(field: TTaskSortField) =>
			write((previous) => ({
				...previous,
				sortBy: field,
				// Clicking the active column flips it; a new column starts ascending.
				sortDir: previous.sortBy === field && previous.sortDir === 'asc' ? 'desc' : 'asc',
				page: DEFAULT_TASK_QUERY.page,
			})),
		[write],
	)

	const setPage = useCallback(
		(page: number) => write((previous) => ({ ...previous, page })),
		[write],
	)

	const clearFilters = useCallback(
		() =>
			write((previous) => ({ ...previous, ...EMPTY_TASK_FILTERS, page: DEFAULT_TASK_QUERY.page })),
		[write],
	)

	return { query, applyFilters, toggleSort, setPage, clearFilters }
}

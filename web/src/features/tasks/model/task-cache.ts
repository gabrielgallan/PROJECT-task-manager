import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { FetchTaskOptionsResponse } from '@/api/fetch-task-options'
import type { FetchTasksResponse } from '@/api/fetch-tasks'
import { taskKeys } from './task-query-keys'

export async function refreshTaskOptions(client: QueryClient, generation: number, current: () => boolean) {
	const queryKey = taskKeys.options(generation)
	await client.cancelQueries({ queryKey })
	if (!current()) return
	client.setQueriesData<InfiniteData<FetchTaskOptionsResponse, string | undefined>>({ queryKey }, (data) =>
		data ? { pages: data.pages.slice(0, 1), pageParams: [undefined] } : undefined)
	await client.invalidateQueries({ queryKey }, { throwOnError: false })
}

export async function reconcileTasks(client: QueryClient, generation: number, current: () => boolean,
	taskId?: string, removed = false, options = false) {
	const listKey = taskKeys.lists(generation)
	await client.cancelQueries({ queryKey: listKey })
	if (!current()) return
	if (taskId) {
		await client.cancelQueries({ queryKey: taskKeys.details(generation, taskId), exact: true })
		if (!current()) return
		if (removed) {
			client.removeQueries({ queryKey: taskKeys.details(generation, taskId), exact: true })
			client.setQueriesData<FetchTasksResponse>({ queryKey: listKey }, (data) => data ? {
				...data, data: data.data.filter((task) => task.id !== taskId),
			} : undefined)
			client.setQueriesData<InfiniteData<FetchTaskOptionsResponse>>({ queryKey: taskKeys.options(generation) }, (data) => data ? {
				...data, pages: data.pages.map((page) => ({ ...page, data: page.data.filter((task) => task.id !== taskId) })),
			} : undefined)
		}
	}
	await Promise.all([
		client.invalidateQueries({ queryKey: listKey }, { throwOnError: false }),
		taskId && !removed ? client.invalidateQueries({ queryKey: taskKeys.details(generation, taskId), exact: true }, { throwOnError: false }) : undefined,
		options ? refreshTaskOptions(client, generation, current) : undefined,
	])
}

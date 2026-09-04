import type { QueryClient } from '@tanstack/react-query'
import type { EditWorkLogRequest } from '@/api/edit-work-log'
import type { EditWorkLogScheduleRequest } from '@/api/edit-work-log-schedule'
import type { FetchWorkLogsResponse } from '@/api/fetch-work-logs'
import type { WorkLogDto } from './work-log-api-types'
import { type NormalizedFetchWorkLogsRequest, workLogKeys } from './work-log-query-keys'

function overlaps(startsAt: string, endsAt: string, from: string, to: string) {
	return Date.parse(startsAt) < Date.parse(to) && Date.parse(endsAt) > Date.parse(from)
}

function matchesFacet(
	id: string | null,
	selected: string[] | undefined,
	without: true | undefined,
) {
	if (!selected && !without) return true
	return (id ? selected?.includes(id) : without) === true
}

function belongsToRequest(workLog: WorkLogDto, request: NormalizedFetchWorkLogsRequest) {
	return (
		overlaps(workLog.startsAt, workLog.endsAt, request.from, request.to) &&
		matchesFacet(workLog.task?.id ?? null, request.taskId, request.withoutTask) &&
		matchesFacet(workLog.category?.id ?? null, request.categoryId, request.withoutCategory)
	)
}

function compareWorkLogs(left: WorkLogDto, right: WorkLogDto) {
	return left.startsAt.localeCompare(right.startsAt) || left.id.localeCompare(right.id)
}

function patchDto(workLog: WorkLogDto, edit: EditWorkLogRequest): WorkLogDto | null {
	if (edit.taskId !== undefined && edit.taskId !== null) return null
	if (edit.categoryId !== undefined && edit.categoryId !== null) return null
	return {
		...workLog,
		...(edit.title !== undefined ? { title: edit.title } : {}),
		...(edit.description !== undefined ? { description: edit.description } : {}),
		...(edit.startsAt !== undefined ? { startsAt: edit.startsAt } : {}),
		...(edit.endsAt !== undefined ? { endsAt: edit.endsAt } : {}),
		...(edit.taskId === null ? { task: null } : {}),
		...(edit.categoryId === null ? { category: null } : {}),
	}
}

export async function reconcileWorkLogs(
	client: QueryClient,
	generation: number,
	current: () => boolean,
	options: {
		removeId?: string
		schedule?: EditWorkLogScheduleRequest
		edit?: EditWorkLogRequest
	} = {},
) {
	const listKey = workLogKeys.lists(generation)
	await client.cancelQueries({ queryKey: listKey })
	if (!current()) return

	if (options.removeId || options.schedule || options.edit) {
		for (const [queryKey, previous] of client.getQueriesData<FetchWorkLogsResponse>({
			queryKey: listKey,
		})) {
			if (!previous) continue
			const request = queryKey[3] as NormalizedFetchWorkLogsRequest | undefined
			client.setQueryData<FetchWorkLogsResponse>(queryKey, {
				...previous,
				data: previous.data
					.flatMap((workLog) => {
						if (workLog.id === options.removeId) return []
						if (options.schedule && workLog.id === options.schedule.workLogId) {
							const next = {
								...workLog,
								startsAt: options.schedule.startsAt ?? workLog.startsAt,
								endsAt: options.schedule.endsAt ?? workLog.endsAt,
							}
							return request && !belongsToRequest(next, request) ? [] : [next]
						}
						if (options.edit && workLog.id === options.edit.workLogId) {
							const next = patchDto(workLog, options.edit)
							return !next || (request && !belongsToRequest(next, request)) ? [] : [next]
						}
						return [workLog]
					})
					.sort(compareWorkLogs),
			})
		}
	}

	await client.invalidateQueries({ queryKey: listKey, refetchType: 'none' })
	if (current())
		void client.refetchQueries({ queryKey: listKey, type: 'active' }, { throwOnError: false })
}

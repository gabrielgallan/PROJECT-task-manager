import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { getTaskDetails } from '@/api/get-task-details'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { reconcileTasks } from '../model/task-cache'
import { toTask } from '../model/task-mappers'
import { taskKeys } from '../model/task-query-keys'
import { taskIdSchema } from '../model/task-schema'

export function useTaskDetailsQuery(taskId: string, enabled = true) {
	const { generation, busy, ended, capture, client } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const validId = taskIdSchema.safeParse(taskId).success
	const query = useQuery({
		queryKey: taskKeys.details(generation, taskId),
		queryFn: async ({ signal }) => {
			const current = capture()
			try { return await getTaskDetails({ taskId }, { signal }) }
			catch (error) { if (!signal.aborted && current()) await revalidateSession(error); throw error }
		},
		select: ({ data }) => ({ ...data, task: toTask(data.task) }),
		enabled: enabled && validId && !busy && !ended,
		retry: false, networkMode: 'always', staleTime: 0,
	})
	const unavailable = getHttpStatus(query.error) === 404
	const reconciled = useRef('')
	useEffect(() => {
		const key = `${generation}:${taskId}`
		if (!unavailable || reconciled.current === key) return
		reconciled.current = key
		// Keep this observer's 404, without invalidating the same detail into a retry loop.
		void reconcileTasks(client, generation, capture(), undefined, false, true)
	}, [unavailable, taskId, generation, client, capture])
	return { ...query, data: unavailable ? undefined : query.data, validId, unavailable }
}

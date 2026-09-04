import { useMutation } from '@tanstack/react-query'
import { useId } from 'react'
import { createWorkLog } from '@/api/create-work-log'
import { deleteWorkLog } from '@/api/delete-work-log'
import { type EditWorkLogRequest, editWorkLog } from '@/api/edit-work-log'
import { type EditWorkLogScheduleRequest, editWorkLogSchedule } from '@/api/edit-work-log-schedule'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { reconcileWorkLogs } from '../model/work-log-cache'
import { WorkLogActionBlockedError } from '../model/work-log-errors'
import { toCreatedWorkLog } from '../model/work-log-mappers'
import { type WorkLogMutationOperation, workLogKeys } from '../model/work-log-query-keys'
import { acquireWorkLogLock } from '../model/work-log-runtime'
import { workLogIdSchema } from '../model/work-log-schema'

function useWorkLogMutation<TData, TVariables>(
	operation: WorkLogMutationOperation,
	call: (variables: TVariables) => Promise<TData>,
	getId?: (variables: TVariables) => string,
) {
	const { generation, capture, client, busy, ended } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const instance = useId()
	const mutation = useMutation({
		mutationKey: workLogKeys.mutation(generation, operation),
		retry: false,
		networkMode: 'always',
		gcTime: 0,
		mutationFn: async ({
			variables,
			current,
		}: {
			variables: TVariables
			current: () => boolean
		}) => {
			if (!current()) throw new WorkLogActionBlockedError()
			const id = getId?.(variables)
			let data: TData
			try {
				data = await call(variables)
			} catch (error) {
				if (!current()) throw new WorkLogActionBlockedError()
				if (current()) {
					const status = getHttpStatus(error)
					if (id && status === 404)
						await reconcileWorkLogs(client, generation, current, { removeId: id })
					else await revalidateSession(error)
				}
				throw error
			}
			if (!current()) throw new WorkLogActionBlockedError()
			if (operation === 'delete' && id)
				await reconcileWorkLogs(client, generation, current, { removeId: id })
			else if (operation === 'schedule')
				await reconcileWorkLogs(client, generation, current, {
					schedule: variables as EditWorkLogScheduleRequest,
				})
			else if (operation === 'edit')
				await reconcileWorkLogs(client, generation, current, {
					edit: variables as EditWorkLogRequest,
				})
			else await reconcileWorkLogs(client, generation, current)
			if (!current()) throw new WorkLogActionBlockedError()
			return data
		},
	})

	async function mutateAsync(variables: TVariables) {
		const current = capture()
		const id = getId?.(variables)
		if (busy || ended || !current()) throw new WorkLogActionBlockedError()
		if (id && !workLogIdSchema.safeParse(id).success) throw new WorkLogActionBlockedError()
		const release = acquireWorkLogLock(client, generation, id ?? `create:${instance}`)
		if (!release) throw new WorkLogActionBlockedError()
		try {
			return await mutation.mutateAsync({ variables, current })
		} finally {
			release()
		}
	}

	return { mutateAsync, isPending: mutation.isPending, reset: mutation.reset }
}

export function useCreateWorkLog() {
	return useWorkLogMutation('create', async (body: Parameters<typeof createWorkLog>[0]) =>
		toCreatedWorkLog((await createWorkLog(body)).data),
	)
}

export function useEditWorkLog() {
	return useWorkLogMutation('edit', editWorkLog, (value) => value.workLogId)
}

export function useDeleteWorkLog() {
	return useWorkLogMutation('delete', deleteWorkLog, (value) => value.workLogId)
}

export function useEditWorkLogSchedule() {
	return useWorkLogMutation('schedule', editWorkLogSchedule, (value) => value.workLogId)
}

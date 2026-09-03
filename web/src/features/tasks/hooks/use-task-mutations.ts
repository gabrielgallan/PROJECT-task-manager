import { useMutation } from '@tanstack/react-query'
import { useId } from 'react'
import { createTask } from '@/api/create-task'
import { deleteTask } from '@/api/delete-task'
import { editTask } from '@/api/edit-task'
import { editTaskSchedule } from '@/api/edit-task-schedule'
import { editTaskStatus } from '@/api/edit-task-status'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { reconcileTasks } from '../model/task-cache'
import { TaskActionBlockedError } from '../model/task-errors'
import { taskKeys, type TaskMutationOperation } from '../model/task-query-keys'
import { taskIdSchema } from '../model/task-schema'
import { acquireTaskLock } from './use-task-pending'

function useTaskMutation<TData, TVariables>(operation: TaskMutationOperation,
	call: (variables: TVariables) => Promise<TData>, getId?: (variables: TVariables) => string) {
	const { generation, capture, client, busy, ended } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const instance = useId()
	const mutation = useMutation({
		mutationKey: taskKeys.mutation(generation, operation),
		retry: false, networkMode: 'always', gcTime: 0,
		mutationFn: async ({ variables, current, session }: { variables: TVariables; current: () => boolean; session: number }) => {
			if (!current()) throw new TaskActionBlockedError()
			const id = getId?.(variables)
			let data: TData
			try { data = await call(variables) }
			catch (error) {
				if (current()) {
					if (getHttpStatus(error) === 404) await reconcileTasks(client, session, current, id, true, true)
					else await revalidateSession(error)
				}
				throw error
			}
			if (current()) await reconcileTasks(client, session, current, id, operation === 'delete', ['create', 'edit', 'delete'].includes(operation))
			return data
		},
	})
	async function mutateAsync(variables: TVariables) {
		const current = capture()
		const id = getId?.(variables)
		if (busy || ended || !current()) throw new TaskActionBlockedError()
		if (id !== undefined && !taskIdSchema.safeParse(id).success) throw new Error('Invalid task selection')
		const release = acquireTaskLock(client, generation, id ?? `create:${instance}`)
		if (!release) throw new TaskActionBlockedError()
		try { return await mutation.mutateAsync({ variables, current, session: generation }) }
		finally { release() }
	}
	return { isPending: mutation.isPending, reset: mutation.reset, mutateAsync }
}

export function useCreateTask() { return useTaskMutation('create', createTask) }
export function useEditTask() { return useTaskMutation('edit', editTask, (v) => v.taskId) }
export function useDeleteTask() { return useTaskMutation('delete', deleteTask, (v) => v.taskId) }
export function useEditTaskStatus() { return useTaskMutation('status', editTaskStatus, (v) => v.taskId) }
export function useEditTaskSchedule() { return useTaskMutation('schedule', editTaskSchedule, (v) => v.taskId) }

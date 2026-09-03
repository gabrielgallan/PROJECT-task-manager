import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { getTaskError, TaskActionBlockedError } from '../model/task-errors'
import { taskChanges, taskCreateBody, taskFormValues } from '../model/task-mappers'
import { taskFormSchema, type TaskFormValues } from '../model/task-schema'
import type { Task } from '../model/task-types'
import { useCreateTask, useEditTask } from './use-task-mutations'

export function useTaskForm(task: Task | undefined, onClose: () => void) {
	const { capture, busy, ended } = useIdentityLifecycle()
	const [original] = useState(() => taskFormValues(task))
	const [error, setError] = useState<string | null>(null)
	const [unavailable, setUnavailable] = useState(false)
	const locked = useRef(false)
	const create = useCreateTask()
	const edit = useEditTask()
	const form = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema), defaultValues: original })
	const changes = taskChanges(form.watch(), original)
	const hasChanges = !task || Object.keys(changes).length > 0
	const pending = form.formState.isSubmitting || create.isPending || edit.isPending
	const disabled = busy || ended || pending

	async function submit(values: TaskFormValues) {
		if (locked.current || disabled || unavailable) return
		const current = capture()
		const patch = taskChanges(values, original)
		if (task && !Object.keys(patch).length) return
		locked.current = true
		setError(null)
		try {
			if (task) await edit.mutateAsync({ taskId: task.id, ...patch })
			else await create.mutateAsync(taskCreateBody(values))
			if (!current()) return
			toast.success(task ? 'Task updated' : 'Task created')
			onClose()
		} catch (failure) {
			if (!current() || failure instanceof TaskActionBlockedError) return
			if (task && getHttpStatus(failure) === 404) setUnavailable(true)
			setError(getTaskError(failure, task ? 'edit' : 'create'))
		} finally { locked.current = false }
	}
	function close() { if (!locked.current && !disabled) onClose() }
	return {
		form, onSubmit: form.handleSubmit(submit, () => setError(null)), close, error,
		pending, disabled, unavailable, hasChanges,
	}
}

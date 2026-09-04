import { Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { planKeys } from '@/features/plans/model/plan-query-keys'
import { useDeleteTask } from '@/features/tasks/hooks/use-task-mutations'
import { getTaskError, TaskActionBlockedError } from '@/features/tasks/model/task-errors'
import type { Task } from '@/features/tasks/model/task-types'
import { workLogKeys } from '@/features/work-logs/model/work-log-query-keys'

export function DeleteTaskDialog({
	task,
	onOpenChange,
	onDeleted,
}: {
	task: Task | null
	onOpenChange: (open: boolean) => void
	onDeleted: (task: Task) => void
}) {
	if (!task) return null
	return (
		<OpenDeleteTaskDialog
			key={task.id}
			task={task}
			onClose={() => onOpenChange(false)}
			onDeleted={onDeleted}
		/>
	)
}
function OpenDeleteTaskDialog({
	task,
	onClose,
	onDeleted,
}: {
	task: Task
	onClose: () => void
	onDeleted: (task: Task) => void
}) {
	const mutation = useDeleteTask()
	const { capture, busy, ended, client, generation } = useIdentityLifecycle()
	const [error, setError] = useState<string | null>(null)
	const [unavailable, setUnavailable] = useState(false)
	const [pending, setPending] = useState(false)
	const locked = useRef(false)
	const disabled = pending || busy || ended
	async function confirm() {
		if (locked.current || disabled || unavailable) return
		locked.current = true
		setPending(true)
		setError(null)
		const current = capture()
		try {
			await mutation.mutateAsync({ taskId: task.id })
			if (!current()) return
			void client.invalidateQueries({ queryKey: planKeys.all }, { throwOnError: false })
			void client.invalidateQueries(
				{ queryKey: workLogKeys.lists(generation) },
				{ throwOnError: false },
			)
			toast.success('Task deleted', {
				description: 'Associated plans and work logs are now unassigned.',
			})
			onDeleted(task)
			onClose()
		} catch (failure) {
			if (!current() || failure instanceof TaskActionBlockedError) return
			if (getHttpStatus(failure) === 404) setUnavailable(true)
			setError(getTaskError(failure, 'delete'))
		} finally {
			locked.current = false
			if (current()) setPending(false)
		}
	}
	function close() {
		if (!locked.current && !disabled) onClose()
	}
	return (
		<AlertDialog open onOpenChange={(open) => !open && close()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<Trash2 className="text-destructive" />
					</AlertDialogMedia>
					<AlertDialogTitle>Delete task</AlertDialogTitle>
					<AlertDialogDescription>
						“{task.title}” will be removed. Plans and work logs pointing to it are kept.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={disabled}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={() => void confirm()}
						disabled={disabled || unavailable}
					>
						{pending ? 'Deleting…' : 'Delete'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

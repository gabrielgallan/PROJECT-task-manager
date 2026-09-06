import { PanelRight, Pencil, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { useTaskPending } from '@/features/tasks/hooks/use-task-pending'
import type { Task } from '@/features/tasks/model/task-types'

type TaskMobileAction = 'details' | 'edit' | 'delete'

interface ITaskMobileActionsSheetProps {
	task: Task | null
	open: boolean
	onOpenChange: (open: boolean) => void
	onDetails: (task: Task) => void
	onEdit: (task: Task) => void
	onDelete: (task: Task) => void
}

export function TaskMobileActionsSheet({
	task,
	open,
	onOpenChange,
	onDetails,
	onEdit,
	onDelete,
}: ITaskMobileActionsSheetProps) {
	if (!task) return null
	return (
		<OpenTaskMobileActionsSheet
			task={task}
			open={open}
			onOpenChange={onOpenChange}
			onDetails={onDetails}
			onEdit={onEdit}
			onDelete={onDelete}
		/>
	)
}

function OpenTaskMobileActionsSheet({
	task,
	open,
	onOpenChange,
	onDetails,
	onEdit,
	onDelete,
}: Omit<ITaskMobileActionsSheetProps, 'task'> & { task: Task }) {
	const pending = useTaskPending(task.id)
	const nextAction = useRef<TaskMobileAction | null>(null)

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) nextAction.current = null
		onOpenChange(nextOpen)
	}

	const choose = (action: TaskMobileAction) => {
		nextAction.current = action
		onOpenChange(false)
	}

	const handleOpenChangeComplete = (nextOpen: boolean) => {
		if (nextOpen) return
		const action = nextAction.current
		nextAction.current = null
		if (action === 'details') onDetails(task)
		if (action === 'edit') onEdit(task)
		if (action === 'delete') onDelete(task)
	}

	return (
		<Sheet
			open={open}
			onOpenChange={handleOpenChange}
			onOpenChangeComplete={handleOpenChangeComplete}
		>
			<SheetContent side="bottom" className="gap-0 rounded-t-xl pb-2">
				<SheetHeader className="pr-12 pb-3">
					<SheetTitle className="truncate">{task.title}</SheetTitle>
					<SheetDescription>Choose an action for this task.</SheetDescription>
				</SheetHeader>

				<div className="grid gap-1 px-2">
					<Button
						variant="ghost"
						className="h-11 w-full justify-start px-3"
						onClick={() => choose('details')}
					>
						<PanelRight />
						Details
					</Button>

					<Button
						variant="ghost"
						className="h-11 w-full justify-start px-3"
						disabled={pending}
						onClick={() => choose('edit')}
					>
						<Pencil />
						Edit
					</Button>

					<Button
						variant="destructive"
						className="h-11 w-full justify-start px-3"
						disabled={pending}
						onClick={() => choose('delete')}
					>
						<Trash2 />
						Delete
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	)
}
